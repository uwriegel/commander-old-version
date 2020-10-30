import { Column } from "./interfaces"

export interface IProcessor {
    getColumns(): Column[]
}