module FolderView
open Model

type Init = string
type ShowHidden = {
    Show: bool
    SelectedIndex: int
}
type Action = int
type Refresh = int
type GetItems = {
    ReqId: int
    StartRange: int
    EndRange: int
}
type ColumnsWidths = string[]

type Sort = {
    Column: int
    Descending: bool
    SelectedIndex: int
    SubItem: bool
}

type ChangePath = string

type Restrict = string

type Backtrack = bool

type ToggleSelection = int

type SelectTo = int 

type SelectFrom = int 

type Index = int

type Message =
    | Init of Init
    | GetItems of GetItems
    | Action of Action
    | ColumnsWidths of ColumnsWidths
    | ShowHidden of ShowHidden
    | Refresh of Refresh
    | Sort of Sort
    | ChangePath of ChangePath
    | Restrict of Restrict
    | RestrictClose 
    | Backtrack of Backtrack
    | ToggleSelection of ToggleSelection
    | SelectAll
    | UnselectAll
    | SelectTo of SelectTo
    | SelectFrom of SelectFrom
    | GetItemPath of Index

let refreshView session () = 
    let payload = { 
        Method = Method.RefreshView
    }
    session.Send (payload :> obj)

let init folderName session = 
    let id = sprintf "folder-%s" folderName
    let path = Settings.getDef<string> (sprintf "%s-path" id) "root"
    let session = { session with Id = id; Path = path }
    let columns = 
        match path with
        | "root" -> 
            Root.enter session
        | path -> 
            FileSystem.enter session
    session.SendWithOptions (columns :> obj)
    session

let initialize (socketSession: Types.Session) =
    let mutable session = {
        Id = "empty"
        ProcessorId = "empty"
        Send = fun (payload: obj) -> ()
        SendWithOptions = fun (payload: obj) -> ()
        OriginalItems = NoItems
        ViewItems =  None
        Path = "" 
        Backtrack = System.Collections.Generic.List<string>()
        BacktrackPosition = -1
        Request = Request ()
    }

    let getItemName index = 
        match getViewItems session with
        | NoItems -> None
        | DriveItems items -> 
            if index > 0 && index < items.Length then
                Some items.[index].Name
            else
                None
        | FileSystemItems items ->
            if index > 0 && index < items.DirectoryItems.Length + 1 then
                Some items.DirectoryItems.[index - 1].Name
            elif index > 0 && index < items.DirectoryItems.Length + items.FileItems.Length + 1 then
                Some items.FileItems.[index - items.DirectoryItems.Length - 1].Name
            else
                None

    let getIndexOfItemName (session: Session) name = 
        match name with
        | Some name ->
            match getViewItems session with
            | NoItems -> 0
            | DriveItems items -> 
                match items |> Array.tryFindIndex (fun n -> n.Name = name) with
                | Some i -> i
                | None -> 0
            | FileSystemItems items ->
                match items.DirectoryItems |> Array.tryFindIndex (fun n -> n.Name = name) with
                | Some i -> i + 1 
                | None -> 
                    match items.FileItems |> Array.tryFindIndex (fun n -> n.Name = name) with
                    | Some i -> i + 1 + items.DirectoryItems.Length
                    | None -> 0
        | None -> 0

    let getItemsCount () = 
        match getViewItems session with
        | NoItems -> 0
        | DriveItems items -> Root.getItemsCount items
        | FileSystemItems items -> FileSystem.getItemsCount items

    let sendItemsSource changedSession indexToSelect =    
        session <- changedSession 
        Settings.setString (sprintf "%s-path" session.Id) session.Path
        let payload = { 
            Method = Method.ItemsSource
            Count = getItemsCount ()
            Path = session.Path
            IndexToSelect = indexToSelect }
        session.Send (payload :> obj)

    let restrictClose () =
        if session.ViewItems.IsSome then
            session <- { session with ViewItems = None }
            session.Send ({Method = Method.RestrictClose; ItemsCount = getItemsCount ()} :> obj)

    let changePath path selectedItemName backtrack = 
        restrictClose ()

        if backtrack then
            session.Backtrack.Add path
            session.BacktrackPosition <- session.Backtrack.Count - 1
        let folderType, changeFolder = 
            match session.OriginalItems with
            | NoItems -> 
                match path with
                | "root" -> FolderType.DriveItems, true
                | _ -> FolderType.FileSystemItems, true
            | DriveItems items -> 
                match path with
                | "root" -> FolderType.DriveItems, false
                | _ -> FolderType.FileSystemItems, true
            | FileSystemItems items ->
                match path with
                | "root" -> FolderType.DriveItems, true
                | _ -> FolderType.FileSystemItems, false
        let changedSession, columns =
            match folderType with
            | FolderType.DriveItems -> 
                Some (Root.getItemsSource session), if changeFolder then Some (Root.enter session) else None 
            | _ -> 
                FileSystem.changeDirectory session path (refreshView session), if changeFolder then Some (FileSystem.enter session) else None
        match columns with 
        | Some columns -> session.SendWithOptions (columns :> obj)
        | None -> ()
        match changedSession with
        | Some changedSession ->
            let index = getIndexOfItemName changedSession selectedItemName 
            sendItemsSource changedSession index
        | None -> ()

    let refresh selectedIndex = 
        let selectedItemName = getItemName selectedIndex
        changePath session.Path selectedItemName false

    let getItemsQueue = MailboxProcessor<GetItems>.Start (fun queue ->
        let rec loop () = async {
            let! getItems = queue.Receive ()
            let items = 
                match getViewItems session with
                | NoItems -> [||]
                | DriveItems items -> Root.getItems items getItems.StartRange getItems.EndRange
                | FileSystemItems items -> FileSystem.getItems items getItems.StartRange getItems.EndRange
            let payload = { Method = Method.Items; Items = items; ReqId = getItems.ReqId }
            session.Send (payload :> obj)
            return! loop ()
        }
        loop ()
    )

    let sort column descending selectedIndex subItem =
        match session.OriginalItems with
        | FileSystemItems fsi -> FileSystem.setSorting column descending subItem
        | _ -> ()
        refresh selectedIndex

    let getItem index = 
        match getViewItems session with
        | NoItems -> { Name = ""; IsSelected = false }
        | DriveItems items -> { Name = ""; IsSelected = false }
        | FileSystemItems items -> FileSystem.getSelectedItem items index

    let selectItem index setSelection = 
        match getViewItems session with
        | NoItems -> ()
        | DriveItems items -> ()
        | FileSystemItems items -> FileSystem.selectItem items index setSelection

    let toggleSelection index = 
        let item = getItem index
        selectItem index (not item.IsSelected)
        refreshView session ()

    let selectAll setSelection = 
        match getViewItems session with
        | NoItems -> ()
        | DriveItems items -> ()
        | FileSystemItems items -> 
            items.DirectoryItems |> Array.iter (fun n -> n.IsSelected <- setSelection)
            items.FileItems |> Array.iter (fun n -> n.IsSelected <- setSelection)
        refreshView session ()            

    let selectTo index = 
        selectAll false 
        match getViewItems session with
        | NoItems -> ()
        | DriveItems items -> ()
        | FileSystemItems items -> 
            let i = min index items.DirectoryItems.Length - 1
            if items.DirectoryItems.Length > 0 && i >= 0 then
                items.DirectoryItems.[0..i] |> Array.iter (fun n -> n.IsSelected <- true)
            let i = index - items.DirectoryItems.Length - 1                
            if items.FileItems.Length > 0 && i >= 0 then
                items.FileItems.[0..i] |> Array.iter (fun n -> n.IsSelected <- true)
        refreshView session ()            

    let selectFrom index = 
        selectAll false 
        match getViewItems session with
        | NoItems -> ()
        | DriveItems items -> ()
        | FileSystemItems items -> 
            let i = max (index - 1) 0
            if  items.DirectoryItems.Length > 0 && i < items.DirectoryItems.Length then
                items.DirectoryItems.[i..] |> Array.iter (fun n -> n.IsSelected <- true)
            let i = max 0 (index - items.DirectoryItems.Length - 1)
            if items.FileItems.Length > 0 && i >= 0 then
                items.FileItems.[i..] |> Array.iter (fun n -> n.IsSelected <- true)
        refreshView session ()            

    let onReceive stream = 
        match Json.deserializeStream<Message> stream with
        | Init folderName -> 
            session <- init folderName session 
            changePath session.Path None true
        | GetItems getItems -> getItemsQueue.Post getItems
        | Action selectedIndex ->
            match getViewItems session with
            | NoItems -> ()
            | DriveItems items -> 
                match Root.action session items selectedIndex with
                | ToFileSystemPath path -> changePath path None (session.Path <> path)
                | _ -> ()                                        
            | FileSystemItems items -> 
                match FileSystem.action session items selectedIndex (refreshView session) with
                | SendGetItems (path, itemToSelect) -> 
                    changePath path itemToSelect (session.Path <> path)
                | ToRoot -> 
                    changePath "root" None (session.Path <> "root")
                    // TODO itemNAme
                    // let path = session.Path
                    // let session = Root.enter session
                    // let pos = 
                    //     match session.OriginalItems with
                    //     | DriveItems items -> items |> Array.findIndex (fun n -> n.MountPoint = Some path)
                    //     | _ -> 0
                    // // TODO: SendGetItems
                    // sendItemsSource session pos
                | _ -> ()
        | ColumnsWidths widths ->
            let str = Json.serialize widths
            Settings.setString (sprintf "%s-widths" session.ProcessorId) str
        | ShowHidden show -> 
            Globals.setShowHidden show.Show
            refresh show.SelectedIndex
        | Refresh selectedIndex -> refresh selectedIndex
        | Sort item -> sort item.Column item.Descending item.SelectedIndex item.SubItem
        | ChangePath path -> changePath path None (session.Path <> path)
        | Restrict value -> 
            let items =         
                match session.OriginalItems with
                | FileSystemItems items -> FileSystem.restrict items value

                // TODO: enter only when changing folder

                | _ -> None
            match items with
            | Some items ->
                session <- { session with ViewItems = Some items } 
                let payload = { Method = Method.Restrict; RestrictValue = value; ItemsCount = getItemsCount () }
                session.Send (payload :> obj)
            | None -> ()
        | RestrictClose -> restrictClose ()
        | Backtrack backDirection -> 
            let backtrack = 
                if backDirection then
                    if session.BacktrackPosition < session.Backtrack.Count - 1 then
                        session.BacktrackPosition <- session.BacktrackPosition + 1
                        true
                    else
                        false
                else
                    if session.BacktrackPosition > 0 then
                        session.BacktrackPosition <- session.BacktrackPosition - 1
                        true
                    else
                        false
            if backtrack then
                let path = session.Backtrack.[session.BacktrackPosition]
                changePath path None false
            else
                session.Send ({ Method = Method.BacktrackEnd } :> obj)
        | ToggleSelection index -> toggleSelection index
        | SelectAll -> selectAll true
        | UnselectAll -> selectAll false
        | SelectTo index -> selectTo index
        | SelectFrom index -> selectFrom index
        | GetItemPath index -> 
            let sendPath path = 
                let payload = { Method = Method.SendPath; Path = path }
                session.Send (payload :> obj)
            match getItemName index, session.OriginalItems with
            | Some name, DriveItems items -> sendPath name
            | Some name, FileSystemItems items -> sendPath <| FileSystem.getItemPath session name
            | _ -> sendPath ""

    let onClose () = ()

    let sendBytes = socketSession.Start onReceive onClose
    session <- { 
        session with 
            Send = sendBytes << Json.serializeToBuffer 
            SendWithOptions = sendBytes << Json.serializeWithOptionsToBuffer 
    }

// TODO: npm install Dialogbox
// TODO: implement createfolder
// TODO: implement rename
// TODO: implement copy/move
// TODO: implement delete (to waste basket)

// TODO: check setup with additional content (Release Version of commander)
// TODO: check setup ignore file
// TODO: electron title bar
// TODO: typescript support for dialogbox-vue

// BUG: <Space> doesn't select/deselect
// BUG: When selecting via <Ins> the listview scrolls wildly
// BUG: When restricting, _ is not recognized
// TODO: Windows: Show Version Column
// TODO: -> Splitter right <- Splitter left |> splitter up |< splitter down
