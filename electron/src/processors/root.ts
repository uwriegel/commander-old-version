import { platformMethods } from "../platforms/platform"
import { ItemType } from "../model/model"
import { formatSize, IProcessor } from "./processor"

export enum RootType {
    HardDrive,
    CdRom
}

export const ROOT = "root"

export interface Drive {
    name: string
    description: string
    type: RootType
    mountPoint: string
    driveType: string
    size: number
}

export class Root implements IProcessor {

    static async create() {
        return new Root(await platformMethods.getDrives()) 
    }

    constructor(drives: Drive[]) { 
        this.drives = 
            drives
                .filter(n => n.mountPoint)
                .sort((a, b) => a.name.localeCompare(b.name)) 
    }

    getColumns() {
        const widths = platformMethods.getInitialDrivesWidths()
        return platformMethods.getDrivesColumns(widths)
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
                columns: this.getColumnItems(n)
            }})
    }

    getPath() { return ROOT }

    getColumnItems(item: Drive) {
        return [
            item.description,
            item.mountPoint,
            formatSize(item.size)
        ]
    }

    drives: Drive[]
}