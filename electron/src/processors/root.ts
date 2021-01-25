import * as _ from 'lodash'
import { platformMethods } from "../platforms/platform"
import { ItemType, FileResult } from "../model/model"
import { changeProcessor, CheckedPath, IProcessor } from "./processor"
import { getDrives } from "filesystem-utilities"

export const ROOT = "root"

export class Root implements IProcessor {
    getColumns() {
        return platformMethods.getDrivesColumns()
    }

    getName = () => "root"

    async changePath(path: string) {
        const drives = await getDrives()
        this.originalDrives = 
            drives                
            .sort((a, b) => a.name.localeCompare(b.name)) 
        this.drives = this.originalDrives
        return ROOT
    }

    getItemsCount() { return this.drives.length }

    getItems(startRange: number, endRange: number) {
        startRange = Math.min(startRange, this.drives.length - 1)
        endRange = Math.min(endRange, this.drives.length - 1)

        const getItem = (item: DriveItem, index: number) => {
            const columns = platformMethods.getDriveColumnItems(item)
            return {
                isSelected: false,
                type: ItemType.Drive,
                index: index + startRange,
                isHidden: false,
                name: item.name,
                display: columns.display,
                columns: columns.columns
            }
        }
        
        return _.
            slice(this.drives, startRange, endRange + 1)
            .map(getItem)
    }

    getItemPath = (index: number) => 
        index  != -1
        ? platformMethods.getDriveItemPath(this.drives[index])
        : null
    
    getItemName = (index: number)=> this.drives[index].name 

    getIndexOfName = (name: string|null) => 
        name 
        ? this.drives.findIndex(n => platformMethods.getDriveID(n) == name)
        : 0

    checkPath = (path: string): CheckedPath => {
        const processor = 
            (path != ROOT) 
            ? changeProcessor(path)
            : this as IProcessor
        return { processor,  path }
    }

    getPath = () => ROOT

    restrict = (value: string) => {
        const restrictedItems = this.originalDrives.filter(n => 
                n.name
                    .substr(0, value.length)
                    .toLocaleLowerCase()
                    .localeCompare(value) == 0)
        if (restrictedItems.length > 0)
            this.drives = restrictedItems
        return restrictedItems.length
    }

    restrictClose = () => {
        if (this.drives.length != this.originalDrives.length) {
            this.drives = this.originalDrives
            return true
        }
        else    
            return false
    }

    sort = ()=>{}
    isWritable = () => false
    getSelectedItems = () => []

    toggleSelection(index: number) {}
    selectAll() {}
    unselectAll() {}
    selectTo(index: number) {}
    selectFrom(index: number) {}
    getCurrentItem = (index: number) => index            
    createFolder = async (name: string) => FileResult.AccessDenied
    delete = async (names: number[]) => FileResult.AccessDenied       
    copy = async (items: number[], target: string, move: boolean) => FileResult.AccessDenied
    getConflicts = async (items: number[], target: string) => []

    drives: DriveItem[] = []
    originalDrives: DriveItem[] = []
}