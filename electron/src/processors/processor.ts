import { Column, Item } from "../model/model"
import { Drive } from "./root"

export interface IProcessor {
    getColumns(): Column[]
    getItemsCount(): number
    getPath(): string
    getItems(startRange: number, endRange: number): Item[]
}

export const formatSize = (size: number) => size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 