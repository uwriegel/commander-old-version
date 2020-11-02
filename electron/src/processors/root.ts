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
    mountPoint: string
    driveType: string
    size: number
}

export class Root implements IProcessor {

    static async create() {
        return new Root(await platformMethods.getDrives()) 
    }

    constructor(drives: Drive[]) { this.drives = drives }

    getColumns() {
        const widths = platformMethods.getInitialDrivesWidths()
        return platformMethods.getDrivesColumns(widths)
    }

    getItemsCount() { return this.drives.length }

    getItems(startRange: number, endRange: number) {
        startRange = Math.min(startRange, this.drives.length - 1)
        endRange = Math.min(endRange, this.drives.length - 1)
        return this.drives.slice(startRange, endRange)
            .map((n, i) => { return {
                isSelected: false,
                type: ItemType.Drive,
                index: i + startRange,
                name: n.name,
                display: n.name,
                isHidden: !n.mountPoint,
                columns:[] //(Platform.getMethods ()).GetDriveColumnItems item
            }})
    }

    getPath() { return ROOT }

    drives: Drive[]
}