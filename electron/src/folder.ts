import { IpcMain } from "electron"
import _ = require("lodash")
import { platformMethods } from "./platforms/platform"
import { ActionMsg, BackTrackMsg, ChangePathMsg, ColumnsMsg, SelectedIndexMsg, GetItems, ItemsMsg, ItemsSource, 
    MainMsg, MainMsgType, RendererMsg, RendererMsgType, 
    RestrictClose, RestrictMsg, RestrictResult, SendPath, Sort, MainFunctionMsg, BooleanResponse, 
    NumbersResponse, NumberResponse, IndexMsg, RendererFunctionMsg } from "./model/model"
import { changeProcessor, CheckedPath, IProcessor } from "./processors/processor"
import { ROOT } from "./processors/root"
import { Initial } from "./processors/initial"

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
                    this.sendToRenderer({ method: RendererMsgType.Items, items, reqId: msg.reqId } as ItemsMsg)
                    break
                case MainMsgType.Action:
                    const actionmsg = args as ActionMsg
                    // TODO: ask processor what to do: changePath or action
                    this.changePathFromIndex(actionmsg.selectedIndex)
                    break
                case MainMsgType.GetItemPath:
                    const getItemPathMsg = args as SelectedIndexMsg
                    const path = this.processor.getItemPath(getItemPathMsg.selectedIndex)
                    this.sendToRenderer({ method: RendererMsgType.SendPath, path } as SendPath)
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
                        this.sendToRenderer({ 
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
                    const selectedItem = this.processor.getItemName((args as Sort).selectedIndex)
                    this.processor.sort(args as Sort)
                    const itemToSelect = this.processor.getIndexOfName(selectedItem)
                    this.refreshView(itemToSelect)
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
                        this.sendToRenderer({ method: RendererMsgType.BacktrackEnd })
                    break
                case MainMsgType.SelectAll:
                    this.processor.selectAll()
                    this.refreshView(-1)
                    break
                case MainMsgType.UnselectAll:
                    this.processor.unselectAll()
                    this.refreshView(-1)
                    break
                case MainMsgType.SelectTo:
                    const selectToMsg = args as SelectedIndexMsg
                    this.processor.selectTo(selectToMsg.selectedIndex)
                    this.refreshView(-1)
                    break
                case MainMsgType.SelectFrom:
                    const selectFromMsg = args as SelectedIndexMsg
                    this.processor.selectFrom(selectFromMsg.selectedIndex)
                    this.refreshView(-1)
                    break
                case MainMsgType.IsDeletable:
                    const functionMsg = args as MainFunctionMsg
                    const res = this.processor.isDeletable()
                    this.sendToRenderer({ method: RendererMsgType.IsDeletable, id: functionMsg.id, value: res } as BooleanResponse)
                    break
                case MainMsgType.GetSelectedItems:
                    const selectedItemsMsg = args as MainFunctionMsg
                    const selectedItems = this.processor.getSelectedItems()
                    this.sendToRenderer({ 
                        method: RendererMsgType.GetSelectedItems, 
                        id: selectedItemsMsg.id, 
                        value: selectedItems } as NumbersResponse)
                    break
                case MainMsgType.GetCurrentItem:
                    const currentItemMsg = args as IndexMsg
                    const currentItem = this.processor.getCurrentItem(currentItemMsg.index)
                    this.sendToRenderer({ 
                        method: RendererMsgType.GetSelectedItems, 
                        id: currentItemMsg.id, 
                        value: currentItem } as NumberResponse)
                    break
                case MainMsgType.ToggleSelection:
                    const toggleSelectionMsg = args as IndexMsg
                    this.processor.toggleSelection(toggleSelectionMsg.index)
                    this.sendToRenderer({ 
                        method: RendererMsgType.ToggleSelection, 
                        id: toggleSelectionMsg.id } as RendererFunctionMsg)
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
        const path = this.processor.getItemPath(index) ?? ""
        const folderToSelect = 
            lastPath.includes(path) 
            ? _.trimStart(lastPath.substr(path!!.length), "/\\")
            : platformMethods.getSelectedFolder(lastPath, path)
        
        const checkedPath = this.processor.checkPath(path)
        this.changePathWithCheckedPath(checkedPath, folderToSelect, true)
    }

    changePathWithCheckedPath = async (checkedPath: CheckedPath, folderToSelect: string|null, backTrack: boolean) => {
        this.restrictClose()

        if (checkedPath.processor != this.processor) {
            const cols = checkedPath.processor.getColumns()
            this.sendToRenderer({ 
                method: RendererMsgType.SetColumns, 
                value: cols, 
                processor: checkedPath.processor.getName()
            } as ColumnsMsg)
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

    refreshView = (indexToSelect = 0) => this.sendToRenderer({ 
            method: RendererMsgType.ItemsSource, 
            path: this.processor.getPath(),
            count: this.processor.getItemsCount(),
            indexToSelect 
        } as ItemsSource)

    restrictClose = () => {
        if (this.processor && this.processor.restrictClose())
            this.sendToRenderer({ method: RendererMsgType.RestrictClose, itemsCount: this.processor.getItemsCount() } as RestrictClose )
    }

    // TODO: change Folder: clear sort or sort
    // TODO: Default folder for dark theme (Linux)
    // TODO: drive types
    // TODO: commander-node has Electron-Menu and Electron titlebar

    sendToRenderer = (msg: RendererMsg) => this.webContents.send(this.name, msg)

    backtrack = [] as string []
    backtrackPosition = -1

    processor: IProcessor = new Initial
    ipcMain: IpcMain
    webContents: Electron.WebContents
    name: string
}