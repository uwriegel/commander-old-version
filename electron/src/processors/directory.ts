import { getFiles } from 'filesystem-utilities'
import { Column } from "model/model"
import { platformMethods } from "../platforms/platform"
import { CheckedPath, IProcessor } from "./processor"

export class Directory implements IProcessor {
    getColumns() { 
        const widths = platformMethods.getInitialDirectoryWidths()
        return platformMethods.getDirectoryColumns(widths)
    }

    async changePath(path: string) {
        // TODO: files, directories and parentitem
        this.items = (await 
            getFiles(path))
            .sort((a, b) => a.name.localeCompare(b.name))
    }
    
    getItemsCount() { return 0 }
    
    getPath(){ return "" }
    
    getItems(startRange: number, endRange: number) { return [] }
    
    checkPath(index: number) { return { processor: this, path: ""} }

    items: FileItem[]
}
