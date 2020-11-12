import { Column, Item, Sort } from "../model/model"
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
    getItemPath(index: number): string|null
    getIndexOfName(name: string|null): number
    checkPath(path: string): CheckedPath
    changePath(path: string, refresh: (()=>void)): Promise<string>
    restrict(value: string): number
    restrictClose(): boolean
    sort(sort: Sort): void
}

export interface CheckedPath {
    processor: IProcessor,
    path: string
}

export const changeProcessor = (path: string): IProcessor => 
    path == ROOT
        ? new Root() as IProcessor
        : new Directory() as IProcessor

export const formatSize = (size: number) => size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 

export const formatDate = (date: Date) => dateFormat.format(date) + " " + timeFormat.format(date)

export const splitFilename = (name: string) => {
    if (name.length < 3)
        return [ name, "" ]
    
    const index = name.lastIndexOf('.')
    return index > 0
    ? [ name.substring(0, index), name.substr(index) ]
    : [ name, "" ]
}