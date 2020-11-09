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
import { Component, Vue } from 'vue-property-decorator'
import { map, filter } from "rxjs/operators"
import { Observable, Subject } from 'rxjs'
import FolderIcon from '../icons/FolderIcon.vue'
import FileIcon from '../icons/FileIcon.vue'
import DriveIcon from '../icons/DriveIcon.vue'
import ParentIcon from '../icons/ParentIcon.vue'
import { 
    RendererMsgType, RendererMsg, Column, ColumnsMsg, MainMsgType, 
    MainMsg, ItemsSource, GetItems, ItemsMsg, ActionMsg, GetItemPathMsg, SendPath, ChangePathMsg, RestrictMsg, RestrictResult, RestrictClose } from "../../electron/src/model/model"

var selectionChangedIndex = 0

const { ipcRenderer } = window.require('electron')

var reqId = 0

const FolderVueProps = Vue.extend({
    props: {
        eventBus: { type: Object, default: () => new Vue() },
        name: String
    }
})

@Component({
    components: {
        FileIcon,
        FolderIcon,
        DriveIcon,
        ParentIcon
    }
})
export default class FolderVue extends FolderVueProps {
    tableEventBus = new Vue()
    selectedIndex = 0
    columns = [ { name: "Name" } ] as Column[]
    basePath = ""
    restrictValue = ""
    itemsSource = { count: 0, getItems: (async () => await []) as (n: number, m: number)=>Promise<any[]>, indexToSelect: 0}
    isBacktrackEnd = false
    keyDown$ = new Subject()

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

        this.$subscribeTo(inserts$, () => {
            // const msg: OutMsg = {
            //     case: OutMsgType.ToggleSelection,
            //     fields: [this.selectedIndex]
            // }
            //this.ws.send(JSON.stringify(msg))
            if (this.selectedIndex < this.itemsSource.count - 1)
                this.selectedIndex++
        })
        this.$subscribeTo(pluses$, () => {
            // const msg: OutMsg = {
            //     case: OutMsgType.SelectAll,
            //     fields: []
            // }
            //this.ws.send(JSON.stringify(msg))
        })        
        this.$subscribeTo(minuses$, () => {
            // const msg: OutMsg = {
            //     case: OutMsgType.UnselectAll,
            //     fields: []
            // }
            //this.ws.send(JSON.stringify(msg))
        })        
        this.$subscribeTo(shiftHomes$, () => {
            // const msg: OutMsg = {
            //     case: OutMsgType.SelectTo,
            //     fields: [this.selectedIndex]
            // }
            //this.ws.send(JSON.stringify(msg))
        })     
        this.$subscribeTo(shiftEnds$, () => {
            // const msg: OutMsg = {
            //     case: OutMsgType.SelectFrom,
            //     fields: [this.selectedIndex]
            // }
            //this.ws.send(JSON.stringify(msg))
        })     
        this.eventBus.$on('focus', () => this.focus ())
        this.eventBus.$on('resize', () => this.tableEventBus.$emit('resize'))
        this.eventBus.$on('path', (path: string) => this.setPath(path))
        this.eventBus.$on('themeChanged', () => 
            setTimeout(() => this.tableEventBus.$emit("themeChanged"), 300))
        this.eventBus.$on('showHidden', (showHidden: boolean) => {
            // const msg: OutMsg = {
            //     case: OutMsgType.ShowHidden,
            //     fields: [{show: showHidden ? true : false, selectedIndex: this.selectedIndex}]
            // }
            //this.ws.send(JSON.stringify(msg))
        })
        this.eventBus.$on('refresh', () => ipcRenderer.send(this.name, { method: MainMsgType.Refresh }))
        this.eventBus.$on('selectionChanged', (index: number) => {
            const msg: GetItemPathMsg = {
                method: MainMsgType.GetItemPath,
                selectedIndex: this.selectedIndex
            }
            ipcRenderer.send(this.name, msg)
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

        // this.ws.onmessage = m => { 
        //     var msg = JSON.parse(m.data) as InMsg
        //     switch (msg.method) {
        //         case InMsgType.RefreshView:
        //             this.itemsSource = { count: this.itemsSource.count, getItems, indexToSelect: this.selectedIndex }
        //             break
        //         case InMsgType.BacktrackEnd:
        //             this.isBacktrackEnd = true
        //             setTimeout(() => this.isBacktrackEnd = false, 300)
        //             break
        //     }
        // }

        ipcRenderer.on(this.name, (_: any, msg: RendererMsg) => {
            switch (msg.method) {
                case RendererMsgType.SetColumns:
                    const colmsg = msg as ColumnsMsg
                    this.columns = colmsg.value
                    break
                case RendererMsgType.ItemsSource:
                    const itemsSource = msg as ItemsSource
                    this.basePath = itemsSource.path
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
            }
        })

        const msg: MainMsg = {
            method: MainMsgType.Init,
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
        // const msg: OutMsg = {
        //     case: OutMsgType.ColumnsWidths,
        //     fields: [ widths ]
        // }
        // this.ws.send(JSON.stringify(msg))
    }

    onColumnClick(index: number, descending: boolean, subItem: boolean) {
        // const msg: OutMsg = {
        //     case: OutMsgType.Sort,
        //     fields: [ {
        //         column: index,
        //         descending,
        //         subItem,
        //         selectedIndex: this.selectedIndex
        //     } ]
        // }
        // this.ws.send(JSON.stringify(msg))
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
            // const msg: OutMsg = {
            //     case: OutMsgType.Backtrack,
            //     fields: [ directionBack ]
            // }
            // this.ws.send(JSON.stringify(msg))
        }
    }

    onInputKeyDown(evt: KeyboardEvent) {
        switch (evt.which) {
            case 9: // TAB
                this.focus()
                evt.stopPropagation()
                evt.preventDefault()
                break
            case 13: // enter
                const path = (this as any).$refs.input.value
                this.setPath(path)
                this.focus()
                break
            default:
                return // exit this handler for other keys
        }
        evt.preventDefault() // prevent
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
