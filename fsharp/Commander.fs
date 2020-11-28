module Commander
open System.Threading

let waitHandle = new ManualResetEvent(false)
let mutable send = fun (payload: obj) -> ()
let mutable sendToUI = fun (payload: obj) -> ()
let mutable sendWithOptions = fun (payload: obj) -> ()
let mutable sendPathChange: Option<string->unit> = None

type PathChanged = string
type ThemeChanged = string

type Message =
    | PathChanged of PathChanged
    | ThemeChanged of ThemeChanged
    | ShowDevTools
    | ToggleFullScreen
    | Exit

let initialize (session: Types.Session) = 
    let onReceive stream =
        match Json.deserializeStream<Message> stream, sendPathChange with
        | PathChanged path, Some change -> change path
        | ThemeChanged theme, _ -> Settings.setString "theme" theme
        | ShowDevTools, _ -> sendToUI {| Method = "showDevTools" |}
        | ToggleFullScreen, _ -> sendToUI {| Method = "toggleFullScreen" |} 
        | Exit, _ -> sendToUI {| Method = "exit" |} 
        | _ -> ()
    let onClose () = printfn "Client has disconnected"

    send <- session.Start onReceive onClose << Json.serializeToBuffer
    if sendPathChange.IsSome then send {| Method = "wantPathChanges" |}

    let theme = Settings.getDef<string> "theme" ((Platform.getMethods()).GetDefaultTheme ())
    send {| Method = "changeTheme"; Theme = theme |}

let initializeUI (session: Types.Session) = 
    let onReceive stream =
        match Json.deserializeStream<Message> stream with
        | _ -> ()
    let onClose () = 
        printfn "UI has disconnected"
        waitHandle.Set () |> ignore

    sendToUI <- session.Start onReceive onClose << Json.serializeToBuffer
    


