import { getDrives } from "filesystem-utilities"
import { Column, Item } from "../model/model"
import { Directory } from "./directory"
import { Root, ROOT } from "./root"

export interface IProcessor {
    getColumns(): Column[]
    getItemsCount(): number
    getPath(): string
    getItems(startRange: number, endRange: number): Item[]
    checkPath(index: number): CheckedPath
    changePath(path: string): Promise<void>
}

export interface CheckedPath {
    processor: IProcessor,
    path: string
}

export const changeProcessor = (path: string) => 
    path == ROOT
    ? new Root()
    : new Directory()


export const formatSize = (size: number) => size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 