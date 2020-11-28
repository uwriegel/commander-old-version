open System
open System.Drawing
open System.Drawing.Imaging
open System.IO
open Model
open Session
open ClrWinApi
open System.Runtime.InteropServices
open Platform
open FileSystem

let sortWith sortIndex isSubItem =
    match sortIndex, isSubItem with
    | 0, _ -> sortName  
    | 1, _ -> sortExtension
    | 2, _ -> sortDate 
    | 3, _ -> sortSize 
    | _ -> sortName 

[<DllImport("user32.dll", SetLastError = true)>]
extern bool SetProcessDpiAwarenessContext(int dpiFlag)

let iconCacheTime = Some (DateTime.Now.ToUniversalTime().ToString "r")

Platform.initialize {
    GetInitialDrivesWidths = (fun () -> [|"34%"; "33%"; "33%" |])
    GetInitialFileSystemWidths = (fun () ->  [|"20%"; "20%"; "20%"; "20"; "20" |])
    GetDrivesColumns = (fun widths -> [| 
        { Name = "Name"; IsSortable = false; Width = widths.[0]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Beschreibung"; IsSortable = false; Width = widths.[1]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Größe"; IsSortable = false; Width = widths.[2]; RightAligned = true; IsExif = false; SubItem = None }
        // TODO: drive type: icon
    |])
    GetFileSystemColumns = (fun widths -> [| 
        { Name = "Name"; IsSortable = true; Width = widths.[0]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Erw."; IsSortable = true; Width = widths.[1]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Datum"; IsSortable = true; Width = widths.[2]; RightAligned = false; IsExif = true; SubItem = None }
        { Name = "Größe"; IsSortable = true; Width = widths.[3]; RightAligned = true; IsExif = false; SubItem = None }
        { Name = "Version"; IsSortable = true; Width = widths.[4]; RightAligned = false; IsExif = false; SubItem = None }
    |])
    GetDrives = (fun () -> 
        DriveInfo.GetDrives ()
        |> Seq.filter (fun n -> n.IsReady)
        |> Seq.sortBy (fun n -> n.Name)
        |> Seq.mapi (fun i n -> {
            Name = n.Name
            Description = n.VolumeLabel
            MountPoint = Some n.Name
            Type = RootType.HardDrive
            DriveType = Some ""
            Size = n.TotalSize
        })
        |> Seq.toArray     
    )
    GetDriveColumnItems = (fun item ->
        [| 
            item.Description
            Helpers.formatSize item.Size
        |]
    )
    GetFileColumnItems = (fun item date ->
        let file, ext = FileSystem.splitFileName item.Name
        file, [| 
            ext
            date.ToString "g"
            Helpers.formatSize item.Size
        |]
    )
    ServeIcon = (fun defaultIconPath (requestSession: RequestSession) -> async {
        let getIcon (ext: string) = async {
            let rec asyncGetIconHandle callCount = async {
                let mutable shinfo = ShFileInfo()
                SHGetFileInfo(ext, FileAttributeNormal, &shinfo, Marshal.SizeOf shinfo,
                    SHGetFileInfoConstants.ICON
                    ||| SHGetFileInfoConstants.SMALLICON
                    ||| SHGetFileInfoConstants.USEFILEATTRIBUTES
                    ||| SHGetFileInfoConstants.TYPENAME) |> ignore

                if shinfo.IconHandle <> IntPtr.Zero then
                    return shinfo.IconHandle
                elif callCount < 3 then
                    do! Async.Sleep 29
                    return! asyncGetIconHandle <| callCount + 1
                else
                    return Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll").Handle
            }
            let! iconHandle = asyncGetIconHandle 0
            use icon = Icon.FromHandle iconHandle
            use bitmap = icon.ToBitmap()
            let ms = new MemoryStream()
            bitmap.Save(ms, ImageFormat.Png)
            ms.Position <- 0L
            DestroyIcon iconHandle |> ignore
            return ms
        }    
        if requestSession.Url |> String.startsWith "/icon/" then
            let requestData = requestSession.RequestData :?> RequestData.RequestData
            let responseData = ResponseData.create requestData
            let isModifiedSince = 
                match responseData.requestData.header.Header "If-Modified-Since" with
                | None -> None
                | Some a when a = "" -> None
                | Some v -> 
                    let pos = v.IndexOf ";"
                    Some (if pos <> -1 then v.Substring (0, pos) else v)

            let modified =  
                match isModifiedSince with
                | Some v -> v <> iconCacheTime.Value
                | None -> true

            if modified then
                let! stream = getIcon requestSession.Url 
                do! Files.serveStream requestSession stream "image/png" iconCacheTime
            else
                do! Response.asyncSend304 responseData
            return true
        else    
            return false
    })
    GetDefaultTheme = (fun () -> "blue")
    MayHasVersion = (fun name -> name |> String.endsWithComparison ".exe" StringComparison.InvariantCultureIgnoreCase 
                                    || name |> String.endsWithComparison ".dll" StringComparison.InvariantCultureIgnoreCase)
    SortWith = sortWith
}

[<EntryPoint>]
[<STAThread>]
let main argv =
    SetProcessDpiAwarenessContext 18 |> ignore
    App.run ()
    0