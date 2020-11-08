import { getFiles } from 'filesystem-utilities'
import * as _ from 'lodash'
import * as ioPath from 'path'
import { ICON_SCHEME, ItemType } from "../model/model"
import { platformMethods } from "../platforms/platform"
import { IProcessor } from "./processor"

interface Parent extends FileItem {

}

export class Directory implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }

    changePath = async (path: string) => {
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
    
    getItemsCount = () => this.items.length 
    
    getPath = () => this.path
    
    getItems = (startRange: number, endRange: number) => { 
        startRange = Math.min(startRange, this.items.length - 1)
        endRange = Math.min(endRange, this.items.length - 1)

        const getItem = (item: FileItem, index: number) => {
            const columns = platformMethods.getDirectoryColumnItems(item, this.path)                        
            return {
                isSelected: false,
                type: index == 0 
                        ? ItemType.Parent
                        : item.isDirectory 
                            ? ItemType.Folder 
                            : ItemType.File,
                index: index + startRange,
                isHidden: item.isHidden,
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
    
    checkPath = (index: number) => { 
        const path = this.items[index].name
        const absolutePath = ioPath.join(this.path, path)
        return { processor: this, path: absolutePath } 
    }

    getItemPath = (index: number) => ioPath.join(this.path, this.items[index].name) 

    items: FileItem[]
    path: string
}
