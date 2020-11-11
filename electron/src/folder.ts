import { IpcMain } from "electron"
import _ = require("lodash")
import { platformMethods } from "./platforms/platform"
import { ActionMsg, BackTrackMsg, ChangePathMsg, ColumnsMsg, GetItemPathMsg, GetItems, ItemsMsg, ItemsSource, 
    MainMsg, MainMsgType, RendererMsg, RendererMsgType, 
    RestrictClose, RestrictMsg, RestrictResult, SendPath, Sort } from "./model/model"
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
                    this.changePathWithCheckedPath(checkedPath, null, true)
                    break
                case MainMsgType.Refresh:
                    this.refresh()
                    break
                case MainMsgType.Restrict:
                    const restrictMsg = args as RestrictMsg
                    const count = this.processor.restrict(restrictMsg.value)
                    if (count > 0) {
                        this.sendToMain({ 
                            method: RendererMsgType.Restrict, 
                            restrictValue: restrictMsg.value, 
                            itemsCount: count 
                        } as RestrictResult)
                    }
                    break
                case MainMsgType.RestrictClose:
                    this.restrictClose()
                    break
                case MainMsgType.Sort:
                    this.restrictClose()
                    this.processor.sort(args as Sort)
                    // TODO: Index To Select
                    this.refreshView(0)
                    break
                case MainMsgType.Backtrack:
                    const backTrackMsg = args as BackTrackMsg
                    let backtrack = false 
                    if (backTrackMsg.direction) {
                        if (this.backtrackPosition < this.backtrack.length - 1) {
                            this.backtrackPosition++
                            backtrack = true
                        }
                        else
                            backtrack = false
                    }
                    else {
                        if (this.backtrackPosition > 0) {
                            this.backtrackPosition--
                            backtrack = true
                        }
                        else
                            backtrack = false
                    }
                    if (backtrack) {
                        let path = this.backtrack[this.backtrackPosition]
                        const checkedPath = this.processor.checkPath(path)
                        this.changePathWithCheckedPath(checkedPath, null, false)
                    }
                    else
                        this.sendToMain({ method: RendererMsgType.BacktrackEnd })
                    break
            }
        })
    }

    init = async () => {
        const path = ROOT
        this.changePathWithCheckedPath({ processor: changeProcessor(path), path }, null, true)
    }

    changePathFromIndex = async (index: number) => {
        const lastPath = this.processor.getPath()
        const path = this.processor.getItemPath(index)
        const folderToSelect = 
            lastPath.includes(path) 
            ? _.trimStart(lastPath.substr(path.length), "/\\")
            : platformMethods.getSelectedFolder(lastPath, path)
        
        const checkedPath = this.processor.checkPath(path)
        this.changePathWithCheckedPath(checkedPath, folderToSelect, true)
    }

    changePathWithCheckedPath = async (checkedPath: CheckedPath, folderToSelect: string, backTrack: boolean) => {
        this.restrictClose()

        if (checkedPath.processor != this.processor) {
            const cols = checkedPath.processor.getColumns()
            this.sendToMain({ method: RendererMsgType.SetColumns, value: cols} as ColumnsMsg)
            this.processor = checkedPath.processor
        }

        const newPath = await this.processor.changePath(checkedPath.path, () => this.refreshView(-1))

        if (backTrack) {
            this.backtrack = _.concat(this.backtrack, newPath)
            this.backtrackPosition = this.backtrack.length - 1
        }
        // TODO: save normalized path to settings
        this.refreshView(this.processor.getIndexOfName(folderToSelect))
    }

    refresh = async () => {
        this.restrictClose()
        await this.processor.changePath(this.processor.getPath(), () => this.refreshView(-1))
        this.refreshView()
    }

    refreshView = (indexToSelect = 0) => this.sendToMain({ 
            method: RendererMsgType.ItemsSource, 
            path: this.processor.getPath(),
            count: this.processor.getItemsCount(),
            indexToSelect 
        } as ItemsSource)

    restrictClose = () => {
        if (this.processor && this.processor.restrictClose())
            this.sendToMain({ method: RendererMsgType.RestrictClose, itemsCount: this.processor.getItemsCount() } as RestrictClose )
    }

    // TODO: set selection
    // TODO: Viewer
    // TODO: drive types
    // TODO: change column widths
    // TODO: Resolution != 100%: itemSize in tybleview wrong! (occurred in Windows)
    // TODO: retrieve column widths
    // TODO: Dialogs
    // TODO: Save commander-fs fs-files in fstools, then delete folder
    // TODO: Save commander-node electron files in this project, then delete folder
    // TODO: Default folder for dark theme (Linux)
    // TODO: Sort: Select last item
    // TODO: change Folder: clear sort or sort

    sendToMain = (msg: RendererMsg) => this.webContents.send(this.name, msg)

    backtrack = [] as string []
    backtrackPosition = -1

    processor: IProcessor
    ipcMain: IpcMain
    webContents: Electron.WebContents
    name: string
}