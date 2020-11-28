module FileSystem
// open Model
// open System
// open System.IO
// open EnumExtensions

// let mutable private getItemsReqId = 0
// let mutable private sortIndex = -1
// let mutable private sortDescending = false
// let setSorting index descending = 
//     sortIndex <- index
//     sortDescending <- descending

// type SortResult = | Greater | Smaller | Equal

// let getSafeItems get =
//     try 
//         get ()
//     with
//     | :? UnauthorizedAccessException -> [||]
//     | :? DirectoryNotFoundException -> [||]
//     | _ -> [||]

// let getItem index items =
//     if index = 0 then 
//         ParentItem
//     elif index > 0 && index < items.DirectoryItems.Length + 1 then
//         DirectoryItem items.DirectoryItems.[index - 1]
//     elif index > 0 && index < items.FileItems.Length + items.DirectoryItems.Length + 1 then
//         FileItem items.FileItems.[index - 1 - items.DirectoryItems.Length]
//     else
//         InvalidItem

// let getExtendedInfo reqId path (fileItems: FileItem array) offset = 
//     // TODO: GetFileVersions
//     let getExifDate file = 
//         match ExifReader.getExif file with
//         | Some exif -> 
//             ExifReader.getDateValue ExifReader.ExifTag.DateTimeOriginal exif
//         | None -> None    

//     fileItems 
//     |> Array.mapi (fun i n -> i, n)
//     |> Array.fold (fun acc (i, file) -> 
//         match reqId = getItemsReqId && file.Name |> String.endsWithComparison ".jpg" StringComparison.InvariantCultureIgnoreCase with
//         | true ->
//             match getExifDate (Path.Combine (path, file.Name)) with
//             | Some dt -> 
//                 fileItems.[i] <- { file with ExifDate = Some dt }
//                 true
//             | None-> acc 
//         | false -> acc
//         ) false     

// let changeDirectory session path refresh = 
//     getItemsReqId <- getItemsReqId + 1
//     let reqId = getItemsReqId
//     let getFiles path =
//         let getDirectories (info: DirectoryInfo) =
//             fun () -> info.GetDirectories()
//             |> getSafeItems

//         let getFiles (info: DirectoryInfo) =
//             fun () -> info.GetFiles()
//             |> getSafeItems

//         let createDirectoryItem (info: DirectoryInfo) =
//             {
//                 Name = info.Name
//                 Date = info.LastWriteTime
//                 IsHidden = hasFlag info.Attributes FileAttributes.Hidden
//             }
//         let createFileItem (info: FileInfo) =
//             {
//                 Name = info.Name
//                 Date = info.LastWriteTime
//                 ExifDate = None
//                 IsHidden = hasFlag info.Attributes FileAttributes.Hidden
//                 Size = info.Length
//             }

//         let directoryItems = 
//             DirectoryInfo path
//                 |> getDirectories
//                 |> Array.sortWith (fun a b -> String.icompare a.Name b.Name)
//                 |> Array.map createDirectoryItem
//                 |> Array.filter (fun n -> Globals.showHidden () || not n.IsHidden)

//         let compare a b =
//             if a < b then   
//                 Smaller
//             elif a > b then   
//                 Greater
//             else
//                 Equal

//         let sortName reverse (a: FileInfo) (b: FileInfo) =
//             match String.icompare a.Name b.Name, reverse with
//             | res, true -> -res
//             | res, false -> res
//         let sortSize reverse (a: FileInfo) (b: FileInfo) =
//             match compare a.Length b.Length, reverse with
//             | SortResult.Smaller, false -> -1
//             | SortResult.Smaller, true -> 1
//             | SortResult.Greater, false -> 1
//             | SortResult.Greater, true -> -1
//             | Equal, _ -> sortName reverse a b
//         let sortDate reverse (a: FileInfo) (b: FileInfo) =
//             match compare a.LastWriteTime b.LastWriteTime, reverse with
//             | SortResult.Smaller, false -> -1
//             | SortResult.Smaller, true -> 1
//             | SortResult.Greater, false -> 1
//             | SortResult.Greater, true -> -1
//             | Equal, _ -> sortName reverse a b


//         let sort = 
//             match sortIndex with
//             | 0 -> sortName sortDescending
//             | 1 -> sortDate sortDescending
//             | 2 -> sortSize sortDescending
//             | _ -> sortName false

//         let fileItems = 
//             DirectoryInfo path
//                 |> getFiles
//                 |> Array.sortWith sort
//                 |> Array.map createFileItem
//                 |> Array.filter (fun n -> Globals.showHidden () || not n.IsHidden)
//         directoryItems, fileItems

//     let directoryItems, fileItems = getFiles path
//     let fi = DirectoryInfo path
//     let newSession = { 
//         session with 
//             ProcessorId = sprintf "%s-%s" session.Id "filesystem"    
//             Items = FileSystemItems { DirectoryItems = directoryItems; FileItems = fileItems }
//             Path = fi.FullName
//             ItemsCount = 1 + directoryItems.Length + fileItems.Length
//     }
//     async { 
//         if getExtendedInfo reqId fi.FullName fileItems (1 + directoryItems.Length) && reqId = getItemsReqId then
//             refresh ()
//     } |> Async.Start
//     if reqId = getItemsReqId then
//         Some newSession
//     else 
//         None

// let enter session path refresh = 
//     let widths = 
//         match Settings.get<string> (sprintf "%s-filesystem-widths" session.Id) with
//         | Some str -> Json.deserialize<string array> str
//         | None -> [|"34%"; "33%"; "33%"|]
//     let payload = { Method = Method.SetColumns; Value = 
//         [| 
//             { Name = "Name"; IsSortable = true; Width = widths.[0]; RightAligned = false; IsExif = false }
//             { Name = "Datum"; IsSortable = true; Width = widths.[1]; RightAligned = false; IsExif = true }
//             { Name = "Größe"; IsSortable = true; Width = widths.[2]; RightAligned = true; IsExif = false }
//         |]
//     } 
    
//     session.Send (payload :> obj)
//     changeDirectory session path refresh

// let getItems (items: FileSystemItems) startRange endRange =
//     let getParentItem () =
//         match startRange with
//         | 0 -> 
//             [|
//                 {
//                     IconPath = ""
//                     Index = 0
//                     Type = ItemType.Parent
//                     Name = ".."
//                     IsExif = false
//                     IsHidden = false
//                     Columns = [| 
//                         ""
//                         ""
//                     |]
//                 }
//             |]
//         | _ -> [||]

//     let getItems getItem startPos (items: 'a array) =
//         let startRange = startRange - startPos
//         let endRange = endRange - startPos
//         let startRange = max 0 startRange
//         let endRange = min endRange (items.Length-1)
//         let getItem = getItem (startPos + startRange)
//         if endRange < startRange then
//             [||]
//         else
//             items.[startRange..endRange]
//             |> Array.mapi getItem

//     let getDirectoryItems =
//         getItems (fun offset i (item: DirectoryItem) -> {
//             IconPath = ""
//             Type = ItemType.Folder
//             Index = i + offset
//             IsExif = false
//             IsHidden = item.IsHidden
//             Name = item.Name
//             Columns = [| 
//                 item.Date.ToString "g"
//                 ""
//             |]
//         })

//     let getFileItems =
//         getItems (fun offset i (item: FileItem) -> 
//             let exif, date = 
//                 match item.ExifDate with
//                 | Some date -> true, date
//                 | None -> false, item.Date
//             {
//                 IconPath = sprintf "%s/icon/x%s" Globals.serviceUrlBase item.Name
//                 Type = ItemType.File
//                 Index = i + offset
//                 IsHidden = item.IsHidden
//                 IsExif = exif
//                 Name = item.Name
//                 Columns = [| 
//                     date.ToString "g"
//                     Helpers.formatSize item.Size
//                 |]
//             })

//     let directoryItems = getDirectoryItems 1 items.DirectoryItems 
//     let pos = items.DirectoryItems.Length + 1
//     let fileItems = getFileItems pos items.FileItems     
//     Array.concat [
//         getParentItem ()
//         directoryItems
//         fileItems
//     ]

// let action (session: Session) (items: FileSystemItems) selectedIndex refresh = 
//     match items |> getItem selectedIndex with
//     | ParentItem -> 
//         if not (session.Path |> String.endsWith ":\\") then
//             let recentPath = session.Path
//             match changeDirectory session (Path.Combine (session.Path, "..")) refresh with
//             | Some session ->
//                 let indexToSelect = 
//                     match session.Items, recentPath |> String.lastIndexOfChar '\\' with
//                     | FileSystemItems items, Some pos -> 
//                         let recentDirectory = recentPath |> String.substring (pos + 1)
//                         match items.DirectoryItems |> Array.tryFindIndex (fun n -> n.Name = recentDirectory) with
//                         | Some index -> index + 1
//                         | _ -> 0
//                     | _ -> 0
//                 SendGetItems (session, indexToSelect)
//             | None -> Performed
//         else
//             ToRoot
//     | DirectoryItem item -> 
//         match changeDirectory session (Path.Combine (session.Path, item.Name)) refresh with
//         | Some session -> SendGetItems (session , 0) 
//         | None -> Performed
//     | FileItem item -> Performed
//     | _ -> Performed

// // TODO: Splitter style

// // TODO: symlink directory
// // TODO: Session: rootPath / or /media/uwe/speicher or /home/uwe => .. -> root
// // TODO: mount drive

