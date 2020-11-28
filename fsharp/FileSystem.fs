module FileSystem
open Model
open System
open System.IO
open EnumExtensions
open Platform

let mutable private sortIndex = -1
let mutable private sortDescending = false
let mutable private sortBySubItem = false
let setSorting index descending subItem = 
    sortIndex <- index
    sortDescending <- descending
    sortBySubItem <- subItem

let sortName reverse (a: FileInfo) (b: FileInfo) =
    match String.icompare a.Name b.Name, reverse with
    | res, true -> -res
    | res, false -> res
let sortExtension reverse (a: FileInfo) (b: FileInfo) =
    let res = 
        match String.icompare a.Extension b.Extension, reverse with
        | res, true -> -res
        | res, false -> res
    if res <> 0 then 
        res
    else sortName reverse a b
let sortSize reverse (a: FileInfo) (b: FileInfo) =
    match compare a.Length b.Length, reverse with
    | Smaller, false -> -1
    | Smaller, true -> 1
    | Greater, false -> 1
    | Greater, true -> -1
    | Equal, _ -> sortName reverse a b
let sortDate reverse (a: FileInfo) (b: FileInfo) =
    match compare a.LastWriteTime b.LastWriteTime, reverse with
    | Smaller, false -> -1
    | Smaller, true -> 1
    | Greater, false -> 1
    | Greater, true -> -1
    | Equal, _ -> sortName reverse a b

let getSafeItems get =
    try 
        get ()
    with
    | :? UnauthorizedAccessException -> [||]
    | :? DirectoryNotFoundException -> [||]
    | _ -> [||]

let splitFileName file =
    match file |> String.lastIndexOfChar '.' with
    | Some pos -> file |> String.substring2 0 pos, file |> String.substring pos
    | None -> file, ""

let getItem index items =
    if index = 0 then 
        ParentItem
    elif index > 0 && index < items.DirectoryItems.Length + 1 then
        DirectoryItem items.DirectoryItems.[index - 1]
    elif index > 0 && index < items.FileItems.Length + items.DirectoryItems.Length + 1 then
        FileItem items.FileItems.[index - 1 - items.DirectoryItems.Length]
    else
        InvalidItem

let getExtendedInfo session reqId path (fileItems: FileItem array) offset = 
    let getExifDate file = 
        match ExifReader.getExif file with
        | Some exif -> 
            ExifReader.getDateValue ExifReader.ExifTag.DateTimeOriginal exif
        | None -> None    

    let maybeExif = String.endsWithComparison ".jpg" StringComparison.InvariantCultureIgnoreCase

    fileItems 
    |> Array.mapi (fun i n -> i, n)
    |> Array.fold (fun acc (i, file) -> 
        match session.Request.IsSame reqId, file.Name |> maybeExif, file.Name |> (Platform.getMethods ()).MayHasVersion with
        | true, true, false ->
            match getExifDate (Path.Combine (path, file.Name)) with
            | Some dt -> 
                fileItems.[i] <- { file with ExifDate = Some dt }
                true
            | None-> acc 
        | _,_,_ -> acc
        ) false     

let changeDirectory session path refresh = 
    let reqId = session.Request.Increment ()
    let getFiles path =
        let getDirectories (info: DirectoryInfo) =
            fun () -> info.GetDirectories()
            |> getSafeItems

        let getFiles (info: DirectoryInfo) =
            fun () -> info.GetFiles()
            |> getSafeItems

        let createDirectoryItem (info: DirectoryInfo) =
            {
                Name = info.Name
                IsSelected = false
                Date = info.LastWriteTime
                IsHidden = hasFlag info.Attributes FileAttributes.Hidden
            }
        let createFileItem (info: FileInfo) =
            {
                Name = info.Name
                Date = info.LastWriteTime
                IsSelected = false
                ExifDate = None
                IsHidden = hasFlag info.Attributes FileAttributes.Hidden
                Size = info.Length
                Version = None
            }

        let directoryItems = 
            DirectoryInfo path
                |> getDirectories
                |> Array.sortWith (fun a b -> String.icompare a.Name b.Name)
                |> Array.map createDirectoryItem
                |> Array.filter (fun n -> Globals.showHidden () || not n.IsHidden)

        let sort = (Platform.getMethods ()).SortWith sortIndex sortBySubItem sortDescending

        let fileItems = 
            DirectoryInfo path
                |> getFiles
                |> Array.sortWith sort
                |> Array.map createFileItem
                |> Array.filter (fun n -> Globals.showHidden () || not n.IsHidden)
        directoryItems, fileItems

    let directoryItems, fileItems = getFiles path
    let fi = DirectoryInfo path
    let newSession = { 
        session with 
            ProcessorId = sprintf "%s-%s" session.Id "filesystem"    
            OriginalItems = FileSystemItems { DirectoryItems = directoryItems; FileItems = fileItems }
            Path = fi.FullName
    }
    async { 
        if getExtendedInfo session reqId fi.FullName fileItems (1 + directoryItems.Length) && session.Request.IsSame reqId then
            refresh ()
    } |> Async.Start
    if session.Request.IsSame reqId then
        Some newSession
    else 
        None

let getItemsCount (items: FileSystemItems) = 
    1 + items.DirectoryItems.Length + items.FileItems.Length

let enter session = 
    let widths = 
        match Settings.get<string> (sprintf "%s-filesystem-widths" session.Id) with
        | Some str -> Json.deserialize<string array> str
        | None -> (Platform.getMethods ()).GetInitialFileSystemWidths ()
    { Method = Method.SetColumns; Value = (Platform.getMethods ()).GetFileSystemColumns widths } 

let getItems (items: FileSystemItems) startRange endRange =
    let getParentItem () =
        match startRange with
        | 0 -> 
            [|
                {
                    IconPath = ""
                    Index = 0
                    Type = ItemType.Parent
                    Name = ".."
                    Display = ".."
                    IsExif = false
                    IsSelected = false
                    IsHidden = false
                    Columns = [| 
                        ""
                        ""
                    |]
                }
            |]
        | _ -> [||]

    let getItems getItem startPos (items: 'a array) =
        let startRange = startRange - startPos
        let endRange = endRange - startPos
        let startRange = max 0 startRange
        let endRange = min endRange (items.Length-1)
        let getItem = getItem (startPos + startRange)
        if endRange < startRange then
            [||]
        else
            items.[startRange..endRange]
            |> Array.mapi getItem

    let getDirectoryItems =
        getItems (fun offset i (item: DirectoryItem) -> {
            IconPath = ""
            Type = ItemType.Folder
            Index = i + offset
            IsExif = false
            IsHidden = item.IsHidden
            IsSelected = item.IsSelected
            Name = item.Name
            Display = item.Name
            Columns = [| 
                ""
                item.Date.ToString "g"
                ""
            |]
        })

    let getExtension file =
        match file |> String.lastIndexOfChar '.' with
        | Some i -> file |> String.substring i
        | None -> file

    let getFileItems =
        getItems (fun offset i (item: FileItem) -> 
            let exif, date = 
                match item.ExifDate with
                | Some date -> true, date
                | None -> false, item.Date
            let display, columns = (Platform.getMethods ()).GetFileColumnItems item date                
            {
                IconPath = sprintf "%s/icon/x%s" Globals.serviceUrlBase <| getExtension item.Name
                Type = ItemType.File
                Index = i + offset
                IsSelected = item.IsSelected
                IsHidden = item.IsHidden
                IsExif = exif
                Name = item.Name
                Display = display
                Columns = columns
            })

    let directoryItems = getDirectoryItems 1 items.DirectoryItems 
    let pos = items.DirectoryItems.Length + 1
    let fileItems = getFileItems pos items.FileItems     
    Array.concat [
        getParentItem ()
        directoryItems
        fileItems
    ]

let action (session: Session) (items: FileSystemItems) selectedIndex refresh = 
    match items |> getItem selectedIndex with
    | ParentItem -> 
        if session.Path <> "/" && not (session.Path |> String.endsWith ":\\") then
            let recentPath = session.Path
//            match changeDirectory session (Path.Combine (session.Path, "..")) refresh with
//            | Some session ->
                // let indexToSelect =     
                //     match (getViewItems session), recentPath |> String.lastIndexOfChar Path.DirectorySeparatorChar with 
                //     | FileSystemItems items, Some pos -> 
                //         let recentDirectory = recentPath |> String.substring (pos + 1)
                //         match items.DirectoryItems |> Array.tryFindIndex (fun n -> n.Name = recentDirectory) with
                //         | Some index -> index + 1
                //         | _ -> 0
                //     | _ -> 0
            let recentDirectory = 
                match recentPath |> String.lastIndexOfChar Path.DirectorySeparatorChar with
                | Some pos -> Some (recentPath |> String.substring (pos + 1))
                | None -> None
            SendGetItems (Path.Combine (session.Path, ".."), recentDirectory)
  //          | None -> Performed
        else
            ToRoot
    | DirectoryItem item -> 
//        match changeDirectory session (Path.Combine (session.Path, item.Name)) refresh with
        SendGetItems (Path.Combine (session.Path, item.Name) , None) 
        //| None -> Performed
    | FileItem item -> Performed
    | _ -> Performed

let restrict (items: FileSystemItems) value =
    let isDirectoryItemIncluded (item: DirectoryItem) = 
        item.Name |> String.startsWithComparison value StringComparison.CurrentCultureIgnoreCase

    let isFileItemIncluded (item: FileItem) = 
        item.Name |> String.startsWithComparison value StringComparison.CurrentCultureIgnoreCase

    let directoryItems = 
        items.DirectoryItems
        |> Array.filter isDirectoryItemIncluded
    let fileItems = 
        items.FileItems
        |> Array.filter isFileItemIncluded
    if directoryItems.Length + fileItems.Length > 0 then
        Some (FileSystemItems { DirectoryItems = directoryItems; FileItems = fileItems })
    else
        None

let getSelectedItem items index = 
    if index = 0 then
        { Name = ".."; IsSelected = false }
    elif index < items.DirectoryItems.Length + 1 then
        let item = items.DirectoryItems.[index - 1]
        { Name = item.Name; IsSelected = item.IsSelected }
    elif index < items.DirectoryItems.Length + items.FileItems.Length + 1 then        
        let item = items.FileItems.[index - 1 - items.DirectoryItems.Length ]
        { Name = item.Name; IsSelected = item.IsSelected }
    else
        { Name = ".."; IsSelected = false }

let selectItem items index setSelection =
    match getItem index items with
    | DirectoryItem item -> item.IsSelected <- setSelection
    | FileItem item -> item.IsSelected <- setSelection
    | _ -> ()

let getItemPath session item = Path.Combine (session.Path, item)

// TODO: symlink directory
// TODO: Session: rootPath / or /media/uwe/speicher or /home/uwe => .. -> root
// TODO: mount drive

