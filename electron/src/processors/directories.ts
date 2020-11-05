import { Column } from "model/model"
import { platformMethods } from "../platforms/platform"
import { CheckedPath, IProcessor } from "./processor"

export class Directories implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }
    getItemsCount() { return 0 }
    getPath(){ return "" }
    getItems(startRange: number, endRange: number) { return [] }
    checkPath(index: number) { return { processor: this, path: ""} }
    async changePath(path: string) {}
}
