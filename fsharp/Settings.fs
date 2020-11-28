module Settings
open System
open System.IO
open Newtonsoft.Json.Linq
open Newtonsoft.Json

let private fileName = Path.Combine (Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "commander.json")
let private locker = obj ()

if not (File.Exists fileName) then
    File.WriteAllText (fileName, "{}")

let private getSettings () = 
    use file = File.OpenText fileName
    use reader = new JsonTextReader (file)
    JToken.ReadFrom reader :?> JObject

let get<'a> key = 
    let get () = 
        let settings= getSettings ()
        Json.get<'a> settings key
    lock locker get

let getDef<'a> key defaultValue = 
    let get () = 
        let settings= getSettings ()
        Json.getDef<'a> settings key defaultValue
    lock locker get

let setString key (value: string) = 
    let set () = 
        let settings = getSettings ()
        settings.[key] <- (JToken.op_Implicit value)
        use file = File.CreateText fileName
        use writer = new JsonTextWriter (file)
        settings.WriteTo writer
    lock locker set
    
let setInt key (value: int) = 
    let set () = 
        let settings = getSettings ()
        settings.[key] <- (JToken.op_Implicit value)
        use file = File.CreateText fileName
        use writer = new JsonTextWriter (file)
        settings.WriteTo writer
    lock locker set
