module Model
open System

type Theme = Blue | Yaru | YaruDark

type Column = {
    Name: string
    SubItem: string option
    IsSortable: bool
    Width: string
    RightAligned: bool
    IsExif: bool
}

type Method = 
    | SetColumns = 1
    | ItemsSource = 2
    | Items = 3
    | RefreshView = 4
    | Restrict = 5
    | RestrictClose = 6
    | BacktrackEnd = 7
    | SendPath = 8

type Columns = {
    Method: Method 
    Value: Column array
}

type ItemsSource = {
    Method: Method 
    Path: string
    Count: int
    IndexToSelect: int
}

type RefreshView = {
    Method: Method 
}

type RestrictResult = {
    Method: Method 
    RestrictValue: string
    ItemsCount: int
}

type RestrictClose = {
    Method: Method 
    ItemsCount: int
}

type SendPath = {
    Method: Method 
    Path: string
}

type ItemType = Parent = 1 | Drive = 2 | Folder = 3 | File = 4

type Item = {
    IconPath: string
    Index: int
    Type: ItemType
    IsHidden: bool
    IsExif: bool
    IsSelected: bool
    Name: string
    Display: string
    Columns: string array
}

type ItemsResult = {
    ReqId: int
    Method: Method 
    Items: Item array
}

type RootType = HardDrive = 0 | CdRom = 1

type DriveItem = {
    Name: string
    Description: string
    Type: RootType
    MountPoint: string option
    DriveType: string option
    Size: int64
}

type DirectoryItem = {
    Name: string
    mutable IsSelected: bool
    Date: DateTime
    IsHidden: bool
}

type Version = {
    Major: int
    Minor: int
    Patch: int 
    Build: int
}

type FileItem = {
    Name: String
    mutable IsSelected: bool
    Date: DateTime
    ExifDate: DateTime option
    Size: int64
    IsHidden: bool
    Version: Version option
}

type FileSystemItem = 
    | InvalidItem
    | ParentItem
    | DirectoryItem of DirectoryItem
    | FileItem of FileItem

type FileSystemItems = {
    DirectoryItems: DirectoryItem array
    FileItems: FileItem array
}

type SelectedItem = {
    Name: String
    IsSelected: bool
}

type FolderType = DriveItems = 0 | FileSystemItems = 1

type Items = 
    | NoItems
    | DriveItems of DriveItem array
    | FileSystemItems of FileSystemItems

type Request() = 
    let mutable id = 0
    
    member this.Increment () = 
        id <- id + 1
        id

    member this.IsSame idToCompare = 
        idToCompare = id



type Session = {
    Id: string
    ProcessorId: string
    Send: obj->unit
    SendWithOptions: obj->unit
    OriginalItems: Items
    ViewItems: Items option
    Path: string
    Backtrack: Collections.Generic.List<string>
    mutable BacktrackPosition: int
    Request: Request
}

let getViewItems session = 
    match session.ViewItems with
    | Some value -> value
    | None -> session.OriginalItems

type ToFileSystemPath = string
type SendGetItems = string * string option
type ActionResult = 
    | Performed
    | ToFileSystemPath of ToFileSystemPath
    | ToRoot
    | SendGetItems of SendGetItems