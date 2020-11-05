import { IpcMain } from "electron"
import { ActionMsg, ColumnsMsg, GetItems, ItemsMsg, ItemsSource, MainMsg, MainMsgType, RendererMsg, RendererMsgType } from "./model/model"
import { changeProcessor, CheckedPath, IProcessor } from "./processors/processor"
import { ROOT } from "./processors/root"

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
                    const items = this.processor.getItems(msg.startRange, msg.endRange)
                    this.sendToMain({ method: RendererMsgType.Items, items, reqId: msg.reqId } as ItemsMsg)
                    break
                case MainMsgType.Action:
                    const actionmsg = args as ActionMsg
                    this.changePath(actionmsg.selectedIndex)
                    break
            }
        })
    }

    async init() {
        // TODO: save path
        const path = ROOT
        this.changePathWithCheckedPath({ processor: changeProcessor(path), path })
    }

    async changePath(index: number) {
        // TODO: changePath session.Path None true            
        const checkedPath = this.processor.checkPath(index)
        this.changePathWithCheckedPath(checkedPath)
    }

    async changePathWithCheckedPath(checkedPath: CheckedPath) {
        // TODO: changePath session.Path None true            
        if (checkedPath.processor != this.processor) {
            const cols = checkedPath.processor.getColumns()
            this.sendToMain({ method: RendererMsgType.SetColumns, value: cols} as ColumnsMsg)
            this.processor = checkedPath.processor
        }
        await this.processor.changePath(checkedPath.path)
        this.sendToMain({ 
            method: RendererMsgType.ItemsSource, 
            path: this.processor.getPath(),
            count: this.processor.getItemsCount()
        } as ItemsSource)
    }

    // TODO: drive types
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