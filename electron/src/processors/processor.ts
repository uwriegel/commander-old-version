import { Column, Item } from "../model/model"

export interface IProcessor {
    getColumns(): Column[]
    getItemsCount(): number
    getPath(): string
    getItems(startRange: number, endRange: number): Item[]
}