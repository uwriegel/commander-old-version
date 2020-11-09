import { getFiles, getExifDate } from 'filesystem-utilities'
import * as _ from 'lodash'
import * as ioPath from 'path'
import { showHidden } from '../menu'
import { ICON_SCHEME, ItemType } from "../model/model"
import { platformMethods } from "../platforms/platform"
import { changeProcessor, IProcessor } from "./processor"
import { ROOT } from './root'

export interface DirectoryItem extends FileItem {
    exifDate?: Date
    version?: VersionInfo
}


export class Directory implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }

    changePath = async (path: string, refresh: ()=>void) => {
        const items = 
            (await getFiles(path))
            .filter(n => showHidden ? true : !n.isHidden)
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
    }
    
    getItemsCount = () => this.items.length 
    
    getPath = () => this.path
    
    getItems = (startRange: number, endRange: number) => { 
        startRange = Math.min(startRange, this.items.length - 1)
        endRange = Math.min(endRange, this.items.length - 1)

        const getItem = (item: DirectoryItem, index: number) => {
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

    getIndexOfName = (name: string) => 
        name 
        ? this.items.findIndex(n => n.name == name)
        : 0

    checkPath = (path: string) => { 
        const processor = 
            path == ROOT 
            ? changeProcessor(path)
            : this
        return { processor, path } 
    }

    items: DirectoryItem[]
    path: string
}
