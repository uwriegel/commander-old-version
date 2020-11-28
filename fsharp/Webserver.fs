module Webserver
open System.IO
open Websocket
open Server
open System.Text 
open Session

let run serveIcons folderWebSocket = 
    let defaultIconPath = Path.Combine (Directory.GetCurrentDirectory (), "dist/assets/img/file.png")

    let serveDefaultStyle (requestSession: RequestSession) = async {
        match requestSession.Url with
        | "/themes/default.css" -> 
            let theme = Settings.getDef<string> "Theme" "blue"
            let response = sprintf "HTTP/1.1 302 Found\r\nLocation: http://localhost:%d/assets/themes/%s.css\r\nContent-Length: 0\r\n\r\n" Globals.port theme
            let bytes = Encoding.Default.GetBytes response
            let requestData = requestSession.RequestData :?> RequestData.RequestData
            do! requestData.session.networkStream.AsyncWrite bytes
            return true
        | _ -> return false
    }    

    let serveFiles (requestSession: RequestSession) = async {
        match requestSession.Query.Value.Request with
        | "getfile" -> 
            match requestSession.Query.Value.Query "file" with
            | Some file -> 
                do! Files.serveFile requestSession file
                return true
            | _ -> return false
        | _ -> return false
    }

    let requests = [ 
        useWebsocket "/commander" Commander.initialize
        useWebsocket "/commander-ui" Commander.initializeUI
        folderWebSocket
        serveIcons defaultIconPath
        serveDefaultStyle 
        serveFiles
        Static.useStatic (Path.Combine (Directory.GetCurrentDirectory (), "dist")) "/" 
    ]

    let configuration = Configuration.create {
        Configuration.createEmpty() with 
            Port = Globals.port
            AllowOrigins = Some [| Globals.debugUrl |]
            Requests = requests
    }
    let server = create configuration 
    server.start ()
    Commander.waitHandle.WaitOne () |> ignore
    server.stop ()