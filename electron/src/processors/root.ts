import { platformMethods } from "../platforms/platform"
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

    getPath() { return ROOT }

    drives: Drive[]
}