import { IpcMain } from "electron"
import { ColumnsMsg, GetItems, ItemsSource, MainMsg, MainMsgType, RendererMsg, RendererMsgType } from "./model/model"
import { IProcessor } from "./processors/processor"
import { ROOT, Root } from "./processors/root"

export class Folder {
    constructor(ipcMain: IpcMain, webContents: Electron.WebContents, name: string) {
        this.ipcMain = ipcMain
        this.webContents = webContents
        this.name = name

        ipcMain.on(name, async (_, args: MainMsg) => {
            switch (args.method) {
                case MainMsgType.Init:
                    this.init()
                    break 
                case MainMsgType.GetItems:
                    const msg = args as GetItems
                    break
            }
            // TODO: changePath session.Path None true            
        })
    }

    async init() {
        console.log("init")
        // TODO: save path
        const path = ROOT
        switch (path) {
            case ROOT:
                this.processor = await Root.create()
                const cols = this.processor.getColumns()
                this.sendToMain({ method: RendererMsgType.SetColumns, value: cols} as ColumnsMsg)
                this.sendToMain({ 
                    method: RendererMsgType.ItemsSource, 
                    path: this.processor.getPath(),
                    count: this.processor.getItemsCount()
                } as ItemsSource)
                break
        }
    }


    // TODO: const process = spawn('python',["./assets/python/icons.py", request])
    //process.stdout.on('data', (data: Buffer) => {
//        const icon = data.toString('utf8').trim()
  //      if (icon != "None") 
    //        response.sendFile(icon)
      //  else
//        response.sendFile(Path.join(__dirname, "../../images/fault.png"))

    // TODO: change column widths
    // TODO: retrieve column widths
    // TODO: Columns on windows

    sendToMain = (msg: RendererMsg) => this.webContents.send(this.name, msg)

    processor: IProcessor
    ipcMain: IpcMain
    webContents: Electron.WebContents
    name: string
}