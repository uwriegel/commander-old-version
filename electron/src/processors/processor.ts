import { Column } from "../model/model"

export interface IProcessor {
    getColumns(): Column[]
}