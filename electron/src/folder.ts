import { IpcMain } from "electron"
import { IProcessor } from "./processors/processor"
import { Root } from "./processors/root"

const ROOT = "root"

enum InMethod {
    Init
}

interface IncomingMsg {
    method: InMethod
}

enum OutMsgType {
    SetColumns = 1,
    ItemsSource,
    Items,
    RefreshView,
    Restrict,
    RestrictClose,
    BacktrackEnd,
    SendPath
}

interface OutMsg {
    method: OutMsgType
}


export class Folder {
    constructor(ipcMain: IpcMain, webContents: Electron.WebContents, name: string) {
        this.ipcMain = ipcMain
        this.webContents = webContents
        this.name = name

        ipcMain.on(name, async (_, args: IncomingMsg) => {
            switch (args.method) {
                case InMethod.Init:
                    this.init()
                    break 
            }
            // TODO: changePath session.Path None true            
        })
    }

    init() {
        console.log("init")
        // TODO: save path
        const path = ROOT
        switch (path) {
            case ROOT:
                this.processor = new Root()
                const cols = this.processor.getColumns()
                this.webContents.send(this.name, { method: OutMsgType.SetColumns, value: cols})
                break
        }
    }

    // TODO: change column widths
    // TODO: retrieve column widths
    // TODO: Columns on windows
    processor: IProcessor
    ipcMain: IpcMain
    webContents: Electron.WebContents
    name: string
}