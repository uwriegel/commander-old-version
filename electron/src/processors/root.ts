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
        return this.drives.slice(startRange, endRange + 1)
            .map((n, i) => { return {
                isSelected: false,
                type: ItemType.Drive,
                index: i + startRange,
                name: n.name,
                display: n.name,
                isHidden: false,
                columns: platformMethods.getDriveColumnItems(n)
            }})
    }

    checkPath(index: number) {
        const path = this.drives[index].name
        const processor = 
            (path != ROOT) 
            ? changeProcessor(path)
            : this
        return { processor,  path }
    }

    getPath() { return ROOT }

    drives: DriveItem[]
}