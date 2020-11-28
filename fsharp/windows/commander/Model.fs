namespace Model
// open System

// type RootType = HardDrive = 0 | CdRom = 1

// type DriveItem = {
//     Name: string
//     Description: string
//     Type: RootType
//     Size: int64
// }

// type DirectoryItem = {
//     Name: string
//     Date: DateTime
//     IsHidden: bool
// }

// type FileItem = {
//     Name: String
//     Date: DateTime
//     ExifDate: DateTime option
//     Size: int64
//     IsHidden: bool
// }

// type FileSystemItem = 
//     | InvalidItem
//     | ParentItem
//     | DirectoryItem of DirectoryItem
//     | FileItem of FileItem

// type FileSystemItems = {
//     DirectoryItems: DirectoryItem array
//     FileItems: FileItem array
// }

// type Items = 
//     | NoItems
//     | DriveItems of DriveItem array
//     | FileSystemItems of FileSystemItems

// type Session = {
//     Id: string
//     ProcessorId: string
//     Send: obj->unit
//     Items: Items
//     ItemsCount: int
//     Path: string
// }

// type ToFileSystemPath = string
// type SendGetItems = Session * int
// type ActionResult = 
//     | Performed
//     | ToFileSystemPath of ToFileSystemPath
//     | ToRoot
//     | SendGetItems of SendGetItems