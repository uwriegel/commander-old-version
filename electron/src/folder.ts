import { IpcMain } from "electron"
import _ = require("lodash")
import { ActionMsg, ChangePathMsg, ColumnsMsg, GetItemPathMsg, GetItems, ItemsMsg, ItemsSource, MainMsg, MainMsgType, RendererMsg, RendererMsgType, SendPath } from "./model/model"
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
                    // TODO: ask processor what to do: changePath or action
                    this.changePathFromIndex(actionmsg.selectedIndex)
                    break
                case MainMsgType.GetItemPath:
                    const getItemPathMsg = args as GetItemPathMsg
                    const path = this.processor.getItemPath(getItemPathMsg.selectedIndex)
                    this.sendToMain({ method: RendererMsgType.SendPath, path } as SendPath)
                    break
                case MainMsgType.ChangePath:
                    const changePathMsg = args as ChangePathMsg
                    const checkedPath = this.processor.checkPath(changePathMsg.path)
                    this.changePathWithCheckedPath(checkedPath, null)
                    break
                case MainMsgType.Refresh:
                    this.refresh()
                    break
            }
        })
    }

    init = async () => {
        const path = ROOT
        this.changePathWithCheckedPath({ processor: changeProcessor(path), path }, null)
    }

    changePathFromIndex = async (index: number) => {
        const lastPath = this.processor.getPath()
        const path = this.processor.getItemPath(index)
        const folderToSelect = 
            lastPath.includes(path) 
            ? _.trimStart(lastPath.substr(path.length), "/\\")
            : null
        const checkedPath = this.processor.checkPath(path)
        this.changePathWithCheckedPath(checkedPath, folderToSelect)
    }

    changePathWithCheckedPath = async (checkedPath: CheckedPath, folderToSelect: string) => {
        // TODO: changePath backtrack: path != selectedPath, not refresh
        if (checkedPath.processor != this.processor) {
            const cols = checkedPath.processor.getColumns()
            this.sendToMain({ method: RendererMsgType.SetColumns, value: cols} as ColumnsMsg)
            this.processor = checkedPath.processor
        }
        await this.processor.changePath(checkedPath.path, () => this.refreshView(-1))
        // TODO: save normalized path to settings
        this.refreshView(this.processor.getIndexOfName(folderToSelect))
    }

    refresh = async () => {
        await this.processor.changePath(this.processor.getPath(), () => this.refreshView(-1))
        this.refreshView()
    }

    refreshView = (indexToSelect = 0) => this.sendToMain({ 
            method: RendererMsgType.ItemsSource, 
            path: this.processor.getPath(),
            count: this.processor.getItemsCount(),
            indexToSelect 
        } as ItemsSource)

    // TODO: Restrict
    // TODO: Sort
    // TODO: Backtrack
    // TODO: set selection
    // TODO: Viewer
    // TODO: drive types
    // TODO: change column widths
    // TODO: retrieve column widths
    // TODO: Save commander-fs fs-files in fstools, then delete folder
    // TODO: Save commander-node electron files in this project, then delete folder
    // TODO: Default folder for dark theme (Linux)

    sendToMain = (msg: RendererMsg) => this.webContents.send(this.name, msg)

    processor: IProcessor
    ipcMain: IpcMain
    webContents: Electron.WebContents
    name: string
}