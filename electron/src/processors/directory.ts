import { getFiles } from 'filesystem-utilities'
import * as _ from 'lodash'
import * as ioPath from 'path'
import { Column, ItemType } from "../model/model"
import { platformMethods } from "../platforms/platform"
import { CheckedPath, IProcessor } from "./processor"

interface Parent extends FileItem {

}

export class Directory implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }

    async changePath(path: string) {
        const items = this.items = await getFiles(path)
        this.path = ioPath.normalize(path)

        const filterDirectories = (item: FileItem) => item.isDirectory
        const filterFiles = (item: FileItem) => !item.isDirectory
        const sortName = (a: FileItem, b: FileItem) => a.name.localeCompare(b.name)

        const parent = [ { name: "..", isDirectory: true, size: 0, time: null, isHidden: null }]
        const dirs = 
            items
            .filter(filterDirectories)
            .sort(sortName)
        const files = 
            items
            .filter(filterFiles)
            .sort(sortName)
        
        this.items = _.concat(parent, dirs, files)
    }
    
    getItemsCount() { return this.items.length }
    
    getPath(){ return this.path }
    
    getItems(startRange: number, endRange: number) { 
        startRange = Math.min(startRange, this.items.length - 1)
        endRange = Math.min(endRange, this.items.length - 1)
        return this.items.slice(startRange, endRange + 1)
            .map((n, i) => { return {
                isSelected: false,
                type: i == 0 
                        ? ItemType.Parent
                        : n.isDirectory 
                            ? ItemType.Folder 
                            : ItemType.File,
                index: i + startRange,
                name: n.name,
                display: n.name,
                isHidden: n.isHidden,
                columns: platformMethods.getDirectoryColumnItems(n)
            }})
    }
    
    checkPath(index: number) { 
        const path = this.items[index].name
        const absolutePath = ioPath.join(this.path, path)
        return { processor: this, path: absolutePath } 
    }

    items: FileItem[]
    path: string
}
