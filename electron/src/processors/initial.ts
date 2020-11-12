import { Sort } from "../model/model"
import { IProcessor } from "./processor"

export class Initial implements IProcessor {
    getColumns = () => []
    getItemsCount = () => 0
    getPath = () => ""
    getItems = (startRange: number, endRange: number) => []
    getItemPath = (index: number) => ""
    getIndexOfName = (name: string|null) => -1
    checkPath = (path: string) => ({ processor: this, path: "" })
    getItemName = (index: number) => ""
    changePath = async (path: string, refresh: ()=>void) => ""
    restrict = (value: string) => 0
    restrictClose = () => false
    sort = (sort: Sort) => {}
}
