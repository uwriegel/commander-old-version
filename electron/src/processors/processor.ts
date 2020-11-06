import { getDrives } from "filesystem-utilities"
import { Column, Item } from "../model/model"
import { Directory } from "./directory"
import { Root, ROOT } from "./root"

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})
const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

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

export const formatDate = (date: Date) => dateFormat.format(date) + " " + timeFormat.format(date)