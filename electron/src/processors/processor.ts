import { Column } from "../model/model"

export interface IProcessor {
    getColumns(): Column[]
    getItemsCount(): number
    getPath(): string
}