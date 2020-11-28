module Platform
open Model
open Session
open System
open System.IO

type Methods = {
    GetInitialDrivesWidths: unit->string array
    GetInitialFileSystemWidths: unit->string array
    GetDrivesColumns: string array->Column array 
    GetFileSystemColumns: string array->Column array 
    GetDrives: unit -> DriveItem array 
    GetDriveColumnItems: DriveItem->string array 
    GetFileColumnItems: FileItem->DateTime->string * string array 
    ServeIcon: string->RequestSession->Async<bool>
    GetDefaultTheme: unit->string
    MayHasVersion: string->bool
    SortWith: int -> bool -> bool -> FileInfo -> FileInfo -> int
}

let mutable private methods: Methods = {
    GetInitialDrivesWidths = (fun () -> [||])
    GetInitialFileSystemWidths = (fun () -> [||])
    GetDrivesColumns = (fun widths -> [||])
    GetFileSystemColumns = (fun widths -> [||])
    GetDrives = (fun () -> [||])
    GetDriveColumnItems = (fun item -> [||])
    GetFileColumnItems = (fun item dateTime -> "", [||])
    ServeIcon = (fun path session -> async { return false})
    GetDefaultTheme = (fun () -> "blue")
    MayHasVersion = (fun name -> false)
    SortWith = (fun sortIndex isSubItem reverse a b -> 0)
}

let initialize methodsToSet = 
    methods <- methodsToSet

let getMethods () = methods

type SortResult = | Greater | Smaller | Equal

let compare a b =
    if a < b then   
        Smaller
    elif a > b then   
        Greater
    else
        Equal
