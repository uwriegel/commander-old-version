import { Sort, FileResult } from "../model/model"
import { IProcessor } from "./processor"

export class Initial implements IProcessor {
    getName = () => "initial"
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
    toggleSelection(index: number) {}
    selectAll() {}
    unselectAll() {}
    selectTo(index: number) {}
    selectFrom(index: number) {}
    setColumnWiths(folderName: string, withs: string[]) {}
    isWritable = () => false
    getSelectedItems = () => []
    getCurrentItem = (index: number) => index      
    createFolder = async (name: string) => FileResult.AccessDenied       
    delete = async (names: number[]) => FileResult.AccessDenied       
    copy = async (items: number[], target: string, move: boolean) => FileResult.AccessDenied
    getConflicts = async (items: number[], target: string) => []
}
