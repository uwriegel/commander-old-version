import { platformMethods } from "../platforms/platform"
import { ItemType } from "../model/model"
import { IProcessor } from "./processor"

export enum RootType {
    HardDrive,
    CdRom
}

export const ROOT = "root"

export interface Drive {
    name: string
    description: string
    type: RootType
    mountPoint?: string
    driveType?: string
    size: number
}

export class Root implements IProcessor {
    getColumns() {
        const widths = platformMethods.getInitialDrivesWidths()
        return platformMethods.getDrivesColumns(widths)
    }

    async changePath(path: string) {
        const drives = await platformMethods.getDrives()
        this.drives = 
            drives                
            .sort((a, b) => a.name.localeCompare(b.name)) 
    }

    getItemsCount() { return this.drives.length }

    getItems(startRange: number, endRange: number) {
        startRange = Math.min(startRange, this.drives.length - 1)
        endRange = Math.min(endRange, this.drives.length - 1)
        return this.drives.slice(startRange, endRange + 1)
            .map((n, i) => { return {
                isSelected: false,
                type: ItemType.Drive,
                index: i + startRange,
                name: n.name,
                display: n.name,
                isHidden: false,
                columns: platformMethods.getColumnItems(n)
            }})
    }

    checkPath(index: number) {
        const path = this.drives[index].name
        const processor = 
            (path != ROOT) 
            ? this
            : this
        return { processor,  path }
    }

    getPath() { return ROOT }

    drives: Drive[]
}