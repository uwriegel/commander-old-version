module FolderView
// open Model

// type Init = string
// type ShowHidden = {
//     Show: bool
//     SelectedIndex: int
// }
// type Action = int
// type Refresh = int
// type GetItems = {
//     ReqId: int
//     StartRange: int
//     EndRange: int
// }
// type ColumnsWidths = string[]

// type Sort = {
//     Column: int
//     Descending: bool
//     SelectedIndex: int
// }

// type ChangePath = string

// type Message =
//     | Init of Init
//     | GetItems of GetItems
//     | Action of Action
//     | ColumnsWidths of ColumnsWidths
//     | ShowHidden of ShowHidden
//     | Refresh of Refresh
//     | Sort of Sort
//     | ChangePath of ChangePath

// let refreshView session () = 
//     let payload = { 
//         Method = Method.RefreshView
//     }
//     session.Send (payload :> obj)

// let init folderName session = 
//     let id = sprintf "folder-%s" folderName
//     let path = Settings.getDef<string> (sprintf "%s-path" id) "root"
//     let session = { session with Id = id }
//     match path with
//     | "root" -> 
//         Some (Root.enter session)
//     | path -> 
//         FileSystem.enter session path (refreshView session)


// let initialize (socketSession: Types.Session) =
//     let mutable session = {
//         Id = "empty"
//         ProcessorId = "empty"
//         Send = fun (payload: obj) -> ()
//         Items = NoItems
//         ItemsCount = 0; Path = "" 
//     }

//     let getItemName index = 
//         match session.Items with
//         | NoItems -> None
//         | DriveItems items -> 
//             if index > 0 && index < items.Length then
//                 Some items.[index].Name
//             else
//                 None
//         | FileSystemItems items ->
//             if index > 0 && index < items.DirectoryItems.Length + 1 then
//                 Some items.DirectoryItems.[index - 1].Name
//             elif index > 0 && index < items.DirectoryItems.Length + items.FileItems.Length + 1 then
//                 Some items.FileItems.[index - items.DirectoryItems.Length - 1].Name
//             else
//                 None

//     let getIndexOfItemName (session: Session) name = 
//         match name with
//         | Some name ->
//             match session.Items with
//             | NoItems -> 0
//             | DriveItems items -> 
//                 match items |> Array.tryFindIndex (fun n -> n.Name = name) with
//                 | Some i -> i
//                 | None -> 0
//             | FileSystemItems items ->
//                 match items.DirectoryItems |> Array.tryFindIndex (fun n -> n.Name = name) with
//                 | Some i -> i + 1 
//                 | None -> 
//                     match items.FileItems |> Array.tryFindIndex (fun n -> n.Name = name) with
//                     | Some i -> i + 1 + items.DirectoryItems.Length
//                     | None -> 0
//         | None -> 0

//     let sendItemsSource changedSession indexToSelect =    
//         session <- changedSession 
//         Settings.setString (sprintf "%s-path" session.Id) session.Path
//         let payload = { 
//             Method = Method.ItemsSource
//             Count = session.ItemsCount
//             Path = session.Path
//             IndexToSelect = indexToSelect }
//         session.Send (payload :> obj)
    
//     let changePath path selectedItemName = 
//         let changedSession = 
//             match session.Items with
//             | NoItems -> Some session
//             | DriveItems items -> 
//                 match path with
//                 | "root" -> Some (Root.getItemsSource session)
//                 | _ -> FileSystem.enter session path (refreshView session)
//             | FileSystemItems items ->
//                 match path with
//                 | "root" -> Some (Root.enter session)
//                 | _ -> FileSystem.changeDirectory session path (refreshView session)
//         match changedSession with
//         | Some changedSession ->
//             let index = getIndexOfItemName changedSession selectedItemName 
//             sendItemsSource changedSession index
//         | None -> ()

//     let refresh selectedIndex = 
//         let selectedItemName = getItemName selectedIndex
//         changePath session.Path selectedItemName

//     let getItemsQueue = MailboxProcessor<GetItems>.Start (fun queue ->
//         let rec loop () = async {
//             let! getItems = queue.Receive ()
//             let items = 
//                 match session.Items with
//                 | NoItems -> [||]
//                 | DriveItems items -> Root.getItems items getItems.StartRange getItems.EndRange
//                 | FileSystemItems items -> FileSystem.getItems items getItems.StartRange getItems.EndRange
//             let payload = { Method = Method.Items; Items = items; ReqId = getItems.ReqId }
//             session.Send (payload :> obj)
//             return! loop ()
//         }
//         loop ()
//     )

//     let sort column descending selectedIndex =
//         match session.Items with
//         | FileSystemItems fsi -> FileSystem.setSorting column descending
//         | _ -> ()
//         refresh selectedIndex

//     let onReceive stream = 
//         match Json.deserializeStream<Message> stream with
//         | Init folderName -> 
//             match init folderName session with
//             | Some session -> sendItemsSource session 0
//             | None -> ()
//         | GetItems getItems -> getItemsQueue.Post getItems
//         | Action selectedIndex ->
//             match session.Items with
//             | NoItems -> ()
//             | DriveItems items -> 
//                 match Root.action session items selectedIndex with
//                 | ToFileSystemPath path -> 
//                     match FileSystem.enter session path (refreshView session) with
//                     | Some session -> sendItemsSource session 0 
//                     | None -> ()
//                 | _ -> ()                                        
//             | FileSystemItems items -> 
//                 match FileSystem.action session items selectedIndex (refreshView session) with
//                 | SendGetItems (session, itemToSelect) -> 
//                     sendItemsSource session itemToSelect
//                 | ToRoot -> 
//                     let session = Root.enter session
//                     // TODO: SendGetItems
//                     // TODO: Select current drive
//                     sendItemsSource session 0
//                 | _ -> ()
//         | ColumnsWidths widths ->
//             let str = Json.serialize widths
//             Settings.setString (sprintf "%s-widths" session.ProcessorId) str
//         | ShowHidden show -> 
//             Globals.setShowHidden show.Show
//             refresh show.SelectedIndex
//         | Refresh selectedIndex -> refresh selectedIndex
//         | Sort item -> sort item.Column item.Descending item.SelectedIndex
//         | ChangePath path -> 
//             match path with
//             | "root" -> 
//                 let session = Root.enter session
//                 // TODO: SendGetItems
//                 sendItemsSource session 0
//             | path -> 
//                 match FileSystem.enter session path (refreshView session) with
//                     | Some session -> sendItemsSource session 0 
//                     | None -> ()

//     let onClose () = ()

//     session <- { session with Send = socketSession.Start onReceive onClose << Json.serializeToBuffer }

    
