open System
open System.Collections.Generic
open System.Diagnostics
open Model
open GtkDotNet
open Session
open System.Runtime.InteropServices
open Platform
open FileSystem

let sortWith sortIndex isSubItem =
    match sortIndex, isSubItem with
    | 0, true -> sortExtension 
    | 0, _ -> sortName 
    | 1, _ -> sortDate 
    | 2, _ -> sortSize 
    | _ -> sortName 

Gtk.Init ()

Platform.initialize {
    GetInitialDrivesWidths = (fun () -> [|"25%"; "25%"; "25%"; "25%"|])
    GetInitialFileSystemWidths = (fun () -> [|"34%"; "33%"; "33%"|])
    GetDrivesColumns = (fun widths -> [| 
        { Name = "Beschreibung"; IsSortable = false; Width = widths.[0]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Name"; IsSortable = false; Width = widths.[1]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Mount"; IsSortable = false; Width = widths.[2]; RightAligned = false; IsExif = false; SubItem = None }
        { Name = "Größe"; IsSortable = false; Width = widths.[3]; RightAligned = true; IsExif = false; SubItem = None }
        // TODO: drive type: icon
    |])
    GetFileSystemColumns = (fun widths -> [| 
        { Name = "Name"; IsSortable = true; Width = widths.[0]; RightAligned = false; IsExif = false; SubItem = Some "Erw." }
        { Name = "Datum"; IsSortable = true; Width = widths.[1]; RightAligned = false; IsExif = true; SubItem = None }
        { Name = "Größe"; IsSortable = true; Width = widths.[2]; RightAligned = true; IsExif = false; SubItem = None }
    |])
    GetDrives = (fun () -> 
        let output = List<string>()
        let prcs = new Process()
        prcs.StartInfo.UseShellExecute  <-  false
        prcs.StartInfo.RedirectStandardOutput  <-  true
        prcs.StartInfo.RedirectStandardError  <-  true
        prcs.StartInfo.FileName  <-  "sh"
        prcs.StartInfo.Arguments  <- "-c \"lsblk --bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE\"" 
        prcs.StartInfo.CreateNoWindow  <-  true
        use d = prcs.OutputDataReceived.Subscribe (fun n -> output.Add(n.Data))
        use d = prcs.ErrorDataReceived.Subscribe(fun n -> printfn "--> %s" n.Data)
        prcs.Start () |> ignore
        prcs.BeginOutputReadLine ()
        prcs.BeginErrorReadLine ()
        prcs.WaitForExit ()

        let isNotNull = isNull >> not
        
        let columnPositions = 
            let title = output.[0]
            [| 
                0
                (title |> String.indexOf "NAME").Value
                (title |> String.indexOf "LABEL").Value
                (title |> String.indexOf "MOUNT").Value
                (title |> String.indexOf "FSTYPE").Value
            |]

        let constructDrive line = 
            let getString pos1 pos2 (line: string)= 
                line |> String.substring2 columnPositions.[pos1] (columnPositions.[pos2] - columnPositions.[pos1])

            let takeOr (alt: string) (first: string) = if first.Length > 0 then first else alt 
            let trimName (s: string )= if s.Length > 2 && s.[1] = '─' then String.substring 2 s else s
            let trim = String.trimChars [| '\n'; ' ' |]
            let mount = line |> getString 3 4 |> trim
            {
                Name = line |> getString 2 3 |> trim |> takeOr mount 
                Description = line |> getString 1 2 |> trimName |> trim
                Type = RootType.HardDrive 
                MountPoint = if mount.Length > 0 then Some mount else None
                DriveType = Some (line |> String.substring columnPositions.[4] |> trim)
                Size = int64 (line |> getString 0 1 |> trim)
            }

        output
        |> Seq.filter isNotNull
        |> Seq.skip 1
        |> Seq.map constructDrive
        |> Seq.sortBy (fun n -> n.MountPoint.IsNone, n.Name)
        |> Seq.filter (fun n -> not n.MountPoint.IsNone && not (n.MountPoint.Value.StartsWith ("/snap")))
        |> Seq.toArray 
    )
    GetDriveColumnItems = (fun item ->
        [| 
            item.Description
            match item.MountPoint with | Some mp -> mp | None -> ""
            Helpers.formatSize item.Size
        |]
    )
    GetFileColumnItems = (fun item date ->
        item.Name, [| 
            date.ToString "g"
            Helpers.formatSize item.Size
        |]
    )
    ServeIcon = (fun defaultIconPath (requestSession: RequestSession) -> async {
        if requestSession.Url |> String.startsWith "/icon/" then
            let iconPath = requestSession.Url |> String.substring 6
            let contentType = Gtk.GuessContentType iconPath
            let icon = Icon.Get contentType
            let theme = Theme.GetDefault ()
            let names = Icon.GetNames icon
            let iconInfo = Theme.ChooseIcon (theme, names, 16, IconInfo.Flags.ForceSvg)
            let ptr = IconInfo.GetFileName iconInfo
            let fileName = Marshal.PtrToStringUTF8 ptr
            GObject.Unref icon
            let fileName = 
                if not (isNull fileName) && not (fileName.EndsWith "application-octet-stream.png") then
                    fileName
                else
                    defaultIconPath
            do! Files.serveFile requestSession fileName
            return true
        else
            return false     
    })
    GetDefaultTheme = (fun () -> "yaru")
    MayHasVersion = (fun name -> false)
    SortWith = sortWith
}

[<EntryPoint>]
[<STAThread>]
let main argv =
    App.run ()
    0