import * as _ from 'lodash'
import { platformMethods } from "../platforms/platform"
import { ItemType } from "../model/model"
import { changeProcessor, IProcessor } from "./processor"
import { getDrives } from "filesystem-utilities"

export const ROOT = "root"

export class Root implements IProcessor {
    getColumns() {
        const widths = platformMethods.getInitialDrivesWidths()
        return platformMethods.getDrivesColumns(widths)
    }

    async changePath(path: string) {
        const drives = await getDrives()
        this.drives = 
            drives                
            .sort((a, b) => a.name.localeCompare(b.name)) 
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

    getItemPath = (index: number) => this.drives[index].mountPoint

    checkPath = (path: string) => {
        const processor = 
            (path != ROOT) 
            ? changeProcessor(path)
            : this
        return { processor,  path }
    }

    getPath = () => ROOT

    drives: DriveItem[]
}