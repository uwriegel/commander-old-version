module Root
open Model

let getItems (items: DriveItem array) startRange endRange = 
    let startRange = min startRange (items.Length - 1)
    let endRange = min endRange (items.Length - 1)

    items.[startRange..endRange]
    |> Array.mapi (fun i item -> {
        IconPath = ""
        IsSelected = false
        Type = ItemType.Drive
        Index = i + startRange
        Name = item.Name
        Display = item.Name
        IsExif = false
        IsHidden = item.MountPoint.IsNone
        Columns = (Platform.getMethods ()).GetDriveColumnItems item
    })

let getItemsSource session = 
    let drives = (Platform.getMethods ()).GetDrives ()
    { 
        session with 
            ProcessorId = sprintf "%s-%s" session.Id "root"
            OriginalItems = DriveItems drives
            Path = "root"
    }

let getItemsCount (drives: DriveItem array) = drives.Length 

let enter session = 
    let widths = 
        match Settings.get<string> (sprintf "%s-root-widths" session.Id) with
        | Some str -> Json.deserialize<string array> str
        | None -> (Platform.getMethods ()).GetInitialDrivesWidths ()
    { Method = Method.SetColumns; Value = (Platform.getMethods ()).GetDrivesColumns widths } 

let action session (items: DriveItem array) selectedIndex = 
    match items.[selectedIndex].MountPoint with 
    | Some path -> ToFileSystemPath path 
    | none -> Performed // TODO: mount drive, then return

// TODO: Folder: Unmounted