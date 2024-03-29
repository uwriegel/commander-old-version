<template>
    <div class="root" @focus=focus @focusin=onfocusIn>
        <input ref="input" v-selectall @keydown='onInputKeyDown' :value="basePath">
        <table-view class="table" :eventBus="tableEventBus" :columns='columns' :itemsSource='itemsSource' 
            :class="{isBacktrackEnd: isBacktrackEnd}"
            @selection-changed="onSelectionChanged" @columns-widths-changed='onColumnsWidthChanged'
            @column-click="onColumnClick" @action="onEnter" v-stream:keydown.native='keyDown$'>
            <template v-slot=row >
                <tr :class="{ 'isCurrent': row.item.index == selectedIndex || (selectedIndex == 0 && !row.item.index),
                    'isHidden': row.item.isHidden, 'isSelected': row.item.isSelected }">
                    <td class="icon-name">
                        <parent-icon v-if='row.item.type == 1' class="svg icon"></parent-icon>
                        <drive-icon v-if='row.item.type == 2' class="svg icon"></drive-icon>
                        <folder-icon v-if='row.item.type == 3' class="svg icon"></folder-icon>
                        <file-icon v-if='row.item.type == 0' class="svg icon"></file-icon>
                        <img v-if='row.item.type == 4' class=icon :src='row.item.iconPath' alt=" " @error="row.item.type=0">
                        {{row.item.display}}
                    </td>
                    <td v-for="(item, i) in row.item.columns" :key=i :class="{ 'rightAligned': columns && columns[i+1] && columns[i+1].rightAligned,
                           'isExif': columns && columns[i+1] && columns[i+1].isExif && row.item.isExif }">
                        {{item}}
                    </td>
                </tr>
            </template>
        </table-view>
        <transition name="slide">
            <input class="restrictor" disabled v-show="restrictValue.length" :value="restrictValue">
        </transition>        
    </div>    
</template>

<script lang="ts">
import * as _ from 'lodash'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { filter } from "rxjs/operators"
import { Subject } from 'rxjs'
import FolderIcon from '../icons/FolderIcon.vue'
import FileIcon from '../icons/FileIcon.vue'
import DriveIcon from '../icons/DriveIcon.vue'
import ParentIcon from '../icons/ParentIcon.vue'
import { 
    RendererMsgType, RendererMsg, Column, ColumnsMsg, MainMsgType, InitMsg,
    ItemsSource, GetItems, ItemsMsg, ActionMsg, SendPath, ChangePathMsg, RestrictMsg,
    RestrictResult, RestrictClose, Sort, BackTrackMsg, SelectedIndexMsg, MainFunctionMsg, BooleanResponse, 
    RendererFunctionMsg, NumbersResponse, IndexMsg, ItemResponse, 
    Item, StringMsg, NumbersMsg, CopyMsg, FileResultResponse, FileResult, ConflictItem, ConflictItemsResponse } from "../../electron/src/model/model"

var selectionChangedIndex = 0

const { ipcRenderer } = window.require('electron')

var reqId = 0
var requestIdSeed = 0
var functionCalls: Map<number, (msg:RendererFunctionMsg)=>void> = new Map

@Component({
    components: {
        FileIcon,
        FolderIcon,
        DriveIcon,
        ParentIcon
    }
})
export default class FolderVue extends Vue {
    @Prop()
    name!: string
    @Prop({ type: Object, default: () => new Vue() })
    eventBus!: Vue

    tableEventBus = new Vue()
    selectedIndex = 0
    columns = [ { name: "Name" } ] as Column[]
    basePath = ""
    restrictValue = ""
    itemsSource = { count: 0, getItems: (async () => await []) as (n: number, m: number)=>Promise<any[]>, indexToSelect: 0}
    isBacktrackEnd = false
    keyDown$ = new Subject()
    processorName = ""
    
    mounted() {
        const shiftTabs$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 9 && n.event.shiftKey))
        const inputChars$ = this.keyDown$.pipe(filter((n: any) => !n.event.altKey && !n.event.ctrlKey && n.event.key.length > 0 && n.event.key.length < 2))
        const backSpaces$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 8))
        const escapes$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 27))
        const inserts$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 45))
        const pluses$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 107))
        const minuses$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 109))
        const shiftEnds$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 35 && n.event.shiftKey))
        const shiftHomes$ = this.keyDown$.pipe(filter((n: any) => n.event.which == 36 && n.event.shiftKey))
        this.$subscribeTo(shiftTabs$, (evt: any) => {
            (this.$refs as any).input.focus()
            evt.event.stopPropagation()
            evt.event.preventDefault()
        })
        this.$subscribeTo(inputChars$, (evt: any) => this.restrictTo(evt.event))
        this.$subscribeTo(backSpaces$, () => this.restrictBack())
        this.$subscribeTo(escapes$, () => this.restrictClose())
        this.$subscribeTo(backSpaces$, (evt: any) => this.onBacktrack(evt.event.ctrlKey ? true : false))

        this.$subscribeTo(inserts$, async () => {
            await this.callFunction({ 
                method: MainMsgType.ToggleSelection, 
                index: this.selectedIndex 
            } as IndexMsg)
            this.tableEventBus.$emit("refreshView")
            this.tableEventBus.$emit("downOne")
        })
        this.$subscribeTo(pluses$, async () => {
            await this.callFunction({ method: MainMsgType.SelectAll })
            this.tableEventBus.$emit("refreshView")
        })        
        this.$subscribeTo(minuses$, async () => {
            await this.callFunction({ method: MainMsgType.UnselectAll })
            this.tableEventBus.$emit("refreshView")
        })        
        this.$subscribeTo(shiftHomes$, async () => {
            await this.callFunction({ 
                index: this.selectedIndex,
                method: MainMsgType.SelectTo 
            } as IndexMsg)
            this.tableEventBus.$emit("refreshView")
        })     
        this.$subscribeTo(shiftEnds$, async () => {
            await this.callFunction({ 
                index: this.selectedIndex,
                method: MainMsgType.SelectFrom 
            } as IndexMsg)
            this.tableEventBus.$emit("refreshView")
        })     
        this.eventBus.$on('focus', () => this.focus ())
        this.eventBus.$on('resize', () => this.tableEventBus.$emit('resize'))
        this.eventBus.$on('path', (path: string) => this.setPath(path))
        this.eventBus.$on('themeChanged', () => 
            setTimeout(() => this.tableEventBus.$emit("themeChanged"), 300))
        this.eventBus.$on('refresh', () => ipcRenderer.send(this.name, { method: MainMsgType.Refresh }))
        this.eventBus.$on('selectionChanged', (index: number) => {
            const msg: SelectedIndexMsg = {
                method: MainMsgType.GetItemPath,
                selectedIndex: this.selectedIndex
            }
            ipcRenderer.send(this.name, msg)
        })
        this.eventBus.$on('getSelectedItems', async (res: (items: number[])=>void) => {
            const result = await this.callFunction({ method: MainMsgType.GetSelectedItems }) as NumbersResponse
            res(result.value)
        })
        this.eventBus.$on('isWritable', async (res: (res: boolean)=>void) => {
            const result = await this.callFunction({ method: MainMsgType.isWritable }) as BooleanResponse
            res(result.value)
        })
        this.eventBus.$on('getCurrentItem', async (res: (item: Item)=>void) => {
            const indexResult = await this.callFunction({ 
                method: MainMsgType.GetCurrentItem, 
                index: this.selectedIndex 
            } as IndexMsg) as ItemResponse
            res(indexResult.value)
        })
        this.eventBus.$on('getSelectedItem', async (res: (item: Item)=>void) => {
            const indexResult = await this.callFunction({ 
                method: MainMsgType.GetSelectedItem, 
                index: this.selectedIndex 
            } as IndexMsg) as ItemResponse
            res(indexResult.value)
        })
        this.eventBus.$on('getPath', async (res: (item: string)=>void) => res(this.basePath))
        this.eventBus.$on('createFolder', async (res: (res: FileResult)=>void, args: string[]) => {
            const mkdirResponse = await this.callFunction({ 
                method: MainMsgType.CreateFolder, 
                value: args[0]
            } as StringMsg) as FileResultResponse
            res(mkdirResponse.value)
        })
        this.eventBus.$on('delete', async (res: (res: FileResult)=>void, args: number[][]) => {
            const mkdirResponse = await this.callFunction({ 
                method: MainMsgType.Delete, 
                value: args[0]
            } as NumbersMsg) as FileResultResponse
            res(mkdirResponse.value)
        })
        this.eventBus.$on('copy', async (res: (res: FileResult)=>void, args: any[]) => {
            const copyResponse = await this.callFunction({ 
                method: MainMsgType.Copy, 
                value: args[0] as number[],
                move: args[1] as boolean,
                target: args[2] as string
            } as CopyMsg) as FileResultResponse
            res(copyResponse.value)
        })
        this.eventBus.$on('getConflicts', async (res: (res: ConflictItem[])=>void, args: any[]) => {
            const response = await this.callFunction({ 
                method: MainMsgType.GetConflicts, 
                value: args[0] as number[],
                target: args[1] as string
            } as CopyMsg) as ConflictItemsResponse
            res(response.value)
        })
                        
        let resolves = new Map<number, (items: any[])=>void>()
        const getItems = async (startRange: number, endRange: number) => {
            return new Promise<any[]>((res, rej) => {
                const msg: GetItems = {
                    method: MainMsgType.GetItems,
                    reqId: ++reqId, 
                    startRange, 
                    endRange 
                }
                resolves.set(reqId, res)
                ipcRenderer.send(this.name, msg)
            })
        }

        ipcRenderer.on(this.name, (e: any, msg: RendererMsg) => {
            switch (msg.method) {
                case RendererMsgType.SetColumns:
                    const colmsg = msg as ColumnsMsg
                    this.processorName = colmsg.processor
                    const widths: string[] = JSON.parse(localStorage[`${this.name}-${this.processorName}`] || "[]")
                    this.columns = _.merge(colmsg.value, widths.map(n => ({ width: n })))
                    break
                case RendererMsgType.ItemsSource:
                    const itemsSource = msg as ItemsSource
                    this.basePath = itemsSource.path
                    localStorage.setItem(`${this.name}-path`, this.basePath)
                    this.itemsSource = { 
                        count: itemsSource.count, 
                        getItems, 
                        indexToSelect: itemsSource.indexToSelect != -1 ? itemsSource.indexToSelect : this.selectedIndex
                    }
                    break
                case RendererMsgType.Items:
                    const items = msg as ItemsMsg
                    const resolve = resolves.get(items.reqId)
                    if (resolve) {
                        resolves.delete(items.reqId)
                        resolve(items.items)
                    }
                    break
                case RendererMsgType.SendPath:
                    const pathMsg = msg as SendPath
                    this.$emit("pathChanged", pathMsg.path, this.basePath) 
                    break
                case RendererMsgType.Restrict:
                    const restrictResult = msg as RestrictResult
                    this.restrictValue = restrictResult.restrictValue      
                    this.itemsSource = { 
                        count: restrictResult.itemsCount, 
                        getItems, 
                        indexToSelect: Math.min(this.selectedIndex, restrictResult.itemsCount - 1)
                    }
                    break
                case RendererMsgType.RestrictClose:
                    const restrictCloseMsg = msg as RestrictClose
                    this.itemsSource.count = restrictCloseMsg.itemsCount
                    this.restrictValue = ""
                    this.itemsSource = { count: this.itemsSource.count, getItems, indexToSelect: 0 }
                    break
                case RendererMsgType.BacktrackEnd:                    
                    this.isBacktrackEnd = true
                    setTimeout(() => this.isBacktrackEnd = false, 300)
                    break
                case RendererMsgType.FunctionReturn:
                    this.onFunctionResult(msg as RendererFunctionMsg)
                    break
            }
        })
        const msg: InitMsg = {
            method: MainMsgType.Init,
            path: localStorage[`${this.name}-path`]
        }
        ipcRenderer.send(this.name, msg)
    }

    get totalCount() {
        return this.itemsSource.count
    }

    onfocusIn() { 
        this.$emit("focus-in") 
        this.onSelectionChanged(this.selectedIndex) 
    }

    onSelectionChanged(index: number) {
        this.selectedIndex = index 
        let currentIndex = ++selectionChangedIndex
        setTimeout(() => {
            if (currentIndex == selectionChangedIndex) {
                this.$emit('selection-changed', index)  
            }
        }, 300)
    }

    onColumnsWidthChanged(widths: string[]) {
        localStorage[`${this.name}-${this.processorName}`] = JSON.stringify(widths)
    }

    onColumnClick(index: number, descending: boolean, subItem: boolean) {
        const msg: Sort = {
            method: MainMsgType.Sort,
            column: index,
            descending,
            subItem,
            selectedIndex: this.selectedIndex
        }
        ipcRenderer.send(this.name, msg)
    }
    
    onEnter() {
        const msg: ActionMsg = {
            method: MainMsgType.Action,
            selectedIndex: this.selectedIndex
        }
        ipcRenderer.send(this.name, msg)
    }

    onBacktrack(directionBack: boolean) {
        if (!this.restrictValue) {
            const msg: BackTrackMsg = {
                method: MainMsgType.Backtrack,
                direction: directionBack
            }
            ipcRenderer.send(this.name, msg)
        }
    }

    onInputKeyDown(evt: KeyboardEvent) {
        switch (evt.which) {
            case 9: // TAB
                this.focus()
                evt.stopPropagation() // don't let this event bubble to the next element 
                break
            case 13: // enter
                const path = (this as any).$refs.input.value
                this.setPath(path)
                this.focus()
                break
            case 46: // del
                evt.stopPropagation() // don't let this event bubble to the next element
                return
            default:
                return // exit this handler for other keys
        }
        evt.preventDefault() // Prevent propagation to input control
    }

    setPath(path: string) {
        const msg: ChangePathMsg = {
            method: MainMsgType.ChangePath,
            path
        }
        ipcRenderer.send(this.name, msg)
    }

    focus() { this.tableEventBus.$emit("focus") }
    
    restrictTo(evt: KeyboardEvent) {   
        const msg: RestrictMsg = {
            method: MainMsgType.Restrict,
            value: this.restrictValue + evt.key
        }
        ipcRenderer.send(this.name, msg)
    }

    restrictBack() {
        if (this.restrictValue.length > 0) {
            this.restrictValue = this.restrictValue.substr(0, this.restrictValue.length - 1);
            if (this.restrictValue.length == 0) 
                this.restrictClose()            
            else {
                const msg: RestrictMsg = {
                    method: MainMsgType.Restrict,
                    value: this.restrictValue
                }
                ipcRenderer.send(this.name, msg)
            }
        }
    }
    restrictClose() { 
        ipcRenderer.send(this.name, { method: MainMsgType.RestrictClose })
    }

    callFunction(msg: MainFunctionMsg) {
        return new Promise<RendererFunctionMsg>((res, rej) => {
            msg.id = ++requestIdSeed
            functionCalls.set(msg.id, res)
            ipcRenderer.send(this.name, msg)
        })
    }

    onFunctionResult(msg: RendererFunctionMsg) {
        const res = functionCalls.get(msg.id)
        functionCalls.delete(msg.id)
        if (res)
            res(msg)
    }
}
</script>

<style scoped>
.root {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.container {
    flex-grow: 1;
    padding: 20px;
    display: flex;
}
.input {
    margin: 20px;
}
.icon-name {
    display: block;
}
.svg {
    fill: var(--icon-color);
    vertical-align: bottom;
}
tr.isSelected .svg {
    fill: var(--icon-selected-color);
}
.icon {
    margin-right: 3px;
    vertical-align: bottom;
    height: 16px;
}
tr.isHidden {
    opacity: 0.5;
}
td.rightAligned {
    text-align: right;
}
td.isExif {
    color: var(--exif-color);
}
tr.isSelected {
    color: var(--selected-color);
    background-color: var(--selected-background-color);
}
tr.isSelected .isExif {
    color: yellow;
}
input {
    background-color: var(--main-background-color);
    color: var(--main-color);
    margin-left: 3px;
    margin-right: 3px;
    border-style: none;
    width: calc(100% - 6px);
    outline-style: none;
    font-family: sans-serif;
}
.table {
    outline-style: none;
    transition: .3s filter, 0.3s background-color;
}
.table.isBacktrackEnd {
    background-color: rgba(255, 0, 0, 0.2);
}
.restrictor {
    width: 70%;
    bottom: 10px;
    height: 18px;
    position: absolute;
    left: 5px;
    box-sizing: border-box;
    border-width: 1px;
    border-radius: 5px;
    padding: 1px 3px;
    border-style: solid;
    border-color: gray;
    color: rgba(0, 0, 0, 0.75);
    background-color: var(--main-background-color);
    box-shadow: 3px 5px 12px 3px rgba(136, 136, 136, 0.55);    
}
.slide-enter-active, .slide-leave-active {
    transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
}
.slide-enter, .slide-leave-to {
    opacity: 0;
    width: 0%;
    height: 0px;
}
</style>
