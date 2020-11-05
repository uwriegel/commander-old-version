import { Column } from "model/model"
import { CheckedPath, IProcessor } from "./processor"

export class Drives implements IProcessor {
    getColumns() { return [] as Column[] }
    getItemsCount() { return 0 }
    getPath(){ return "" }
    getItems(startRange: number, endRange: number) { return [] }
    checkPath(index: number) { return { processor: this, path: ""} }
    async changePath(path: string) {}
}
