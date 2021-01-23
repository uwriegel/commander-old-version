import { getFiles, getExifDate, createFolder, trash, copy, move } from 'filesystem-utilities'
import * as _ from 'lodash'
import * as ioPath from 'path'
import * as fs from 'fs'
import { showHidden } from '../menu'
import { ICON_SCHEME, ItemType, Sort, FileResult } from "../model/model"
import { platformMethods } from "../platforms/platform"
import { changeProcessor, CheckedPath, IProcessor } from "./processor"
import { ROOT } from './root'
import { FileException } from 'model/model'
const fsa = fs.promises

export interface DirectoryItem extends FileItem {
    exifDate?: Date|null
    version?: VersionInfo|null
    isSelected?: boolean
}

export class Directory implements IProcessor {
    getColumns() { 
        return platformMethods.getDirectoryColumns()
    }

    getName = () => "directory"

    changePath = async (path: string, refresh: ()=>void) => {
        const items = 
            (await getFiles(path))
            .filter(n => showHidden ? true : !n.isHidden)
        this.path = ioPath.normalize(path)

        const filterDirectories = (item: FileItem) => item.isDirectory
        const filterFiles = (item: FileItem) => !item.isDirectory
        const sortName = (a: FileItem, b: FileItem) => a.name.localeCompare(b.name)

        const parent: DirectoryItem[] = [ { name: "..", isDirectory: true, size: 0 }]
        const dirs = 
            items
            .filter(filterDirectories)
            .sort(sortName)
        const files = 
            items
            .filter(filterFiles)
            .sort(sortName)

        this.fileIndex = dirs.length + 1
        this.originalItems = _.concat(parent, dirs, files)
        this.items = this.originalItems
        
        const getExtendedInfos = async () => {
            const jpgs = this.items.filter(n => n.name.toLowerCase().endsWith(".jpg"))
            for (let i = 0; i < jpgs.length; i++) {
                const jpg = jpgs[i]
                jpg.exifDate = await getExifDate(ioPath.join(this.path, jpg.name))
                if (i % 50 == 0)
                    refresh()        
            }
            refresh()
        }
        getExtendedInfos()
        platformMethods.getExtendedInfos(this.items, this.path, refresh)
        return this.path
    }
    
    getItemsCount = () => this.items.length 
    
    getPath = () => this.path
    
    getItems = (startRange: number, endRange: number) => { 
        startRange = Math.min(startRange, this.items.length - 1)
        endRange = Math.min(endRange, this.items.length - 1)

        const getItem = (item: DirectoryItem, index: number) => {
            const columns = platformMethods.getDirectoryColumnItems(item, this.path)                        
            return {
                isSelected: item.isSelected as boolean,
                type: item.name == ".."
                        ? ItemType.Parent
                        : item.isDirectory 
                            ? ItemType.Folder 
                            : ItemType.File,
                index: index + startRange,
                isHidden: item.isHidden,
                isExif: !!item.exifDate,
                iconPath: `${ICON_SCHEME}://${columns.icon}`,
                name: item.name,
                display: columns.display,
                columns: columns.columns
            }
        }

        return _
            .slice(this.items, startRange, endRange + 1)
            .map(getItem)
    }
    
    getItemPath = (index: number) => {
        const path =  ioPath.join(this.path, this.items[index].name) 
        return path != this.path ? path : "root"
    }

    getItemName = (index: number) => this.items[index].name 

    getIndexOfName = (name: string|null) => 
        name 
        ? this.items.findIndex(n => n.name == name)
        : 0

    checkPath = (path: string): CheckedPath => { 
        const processor = 
            path == ROOT 
            ? changeProcessor(path)
            : this as IProcessor
        return { processor, path } 
    }

    restrict = (value: string) => {
        const restrictedItems = this.originalItems.filter(n => 
                n.name
                    .substr(0, value.length)
                    .toLocaleLowerCase()
                    .localeCompare(value) == 0)
        if (restrictedItems.length > 0)
            this.items = restrictedItems
        return restrictedItems.length
    }

    restrictClose = () => {
        if (this.items.length != this.originalItems.length) {
            this.items = this.originalItems
            return true
        }
        else    
            return false
    }

    sort = (sort: Sort) => {
        const dirs = this.originalItems.slice(0, this.fileIndex)    
        const files = this.originalItems.slice(this.fileIndex)    
        const sortedFiles = platformMethods.sortFiles(files, sort)
        this.originalItems = _.concat(dirs, sortedFiles)
        this.items = this.originalItems        
    }

    toggleSelection(index: number) {
        const item = this.items[index]
        if (item.name != "..")
            item.isSelected = !item.isSelected
    }

    selectAll() {
        this.items
            .filter(n => n.name != "..")
            .forEach(n => n.isSelected = true)
    }

    unselectAll() {
        this.items.forEach(n => n.isSelected = false)
    }

    selectTo(index: number) {
        this.items
            .filter(n => n.name != "..")
            .forEach((n, i) => n.isSelected = i < index)
    }

    selectFrom(index: number) {
        this.items
        .filter(n => n.name != "..")
        .forEach((n, i) => n.isSelected = i >= index - 1)
    }

    isWritable = () => true

    getSelectedItems = () => 
        this.originalItems
            .map((n, i) => ({ index: i, isSelected: n.isSelected}))
            .filter(n => n.isSelected)
            .map(n => n.index)

    getCurrentItem = (index: number) => {
        const element = this.items[index]
        return this.originalItems.findIndex(n => n == element)
    }

    async createFolder(name: string) {
        const dir = ioPath.join(this.path, name)
        try {
            await createFolder(dir)
            return FileResult.Success
        } catch (e) {
            const fe = e as FileException
            return fe.res
        }
    }

    async delete(items: number[]) {
        const files = items.map(n => ioPath.join(this.path, this.originalItems[n].name))
        try {
            await trash(files)
            return FileResult.Success
        } catch (e) {
            const fe = e as FileException
            return fe.res
        }
    }

    async copy(items: number[], target: string, moveFiles: boolean) {
        const files = items.map(n => ioPath.join(this.path, this.originalItems[n].name))
        try {
            await (moveFiles ? move(files, target) : copy(files, target))
            return FileResult.Success
        } catch (e) {
            const fe = e as FileException
            return fe.res
        }
    }

    originalItems : DirectoryItem[] = []
    items: DirectoryItem[]= []
    path: string = ""
    fileIndex = 0
}
