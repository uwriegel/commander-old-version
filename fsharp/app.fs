module App
open System
open System.IO

let run () =
    if Environment.CurrentDirectory.Contains "netcoreapp" then
        Environment.CurrentDirectory <- Path.Combine (Environment.CurrentDirectory, "../../../../")

    let folderWebSocket = Websocket.useWebsocket "/folder" FolderView.initialize 
    Webserver.run (Platform.getMethods()).ServeIcon folderWebSocket 
    // #if DEBUG
    // let uri = Globals.debugUrl + "/"
    // #else
    // let uri = sprintf "http://localhost:%d/" Globals.port
    // #endif



