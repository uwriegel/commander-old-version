import { getFiles } from 'filesystem-utilities'
import { Column, ItemType } from "../model/model"
import { platformMethods } from "../platforms/platform"
import { CheckedPath, IProcessor } from "./processor"

export class Directory implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }

    async changePath(path: string) {
        // TODO: files, directories and parentitem
        this.items = (await 
            getFiles(path))
            .sort((a, b) => a.name.localeCompare(b.name))
    }
    
    getItemsCount() { return this.items.length }
    
    getPath(){ return "" }
    
    getItems(startRange: number, endRange: number) { 
        startRange = Math.min(startRange, this.items.length - 1)
        endRange = Math.min(endRange, this.items.length - 1)
        return this.items.slice(startRange, endRange + 1)
            .map((n, i) => { return {
                isSelected: false,
                type: ItemType.File,
                index: i + startRange,
                name: n.name,
                display: n.name,
                isHidden: n.isHidden,
                columns: platformMethods.getDirectoryColumnItems(n)
            }})
    }
    
    checkPath(index: number) { return { processor: this, path: ""} }

    items: FileItem[]
}
