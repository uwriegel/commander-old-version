import * as path from 'path'
import { formatDate, formatSize } from "../processors/processor"
import { IPlatform } from "./platform"

export class Linux implements IPlatform {
    getInitialDrivesWidths() { return ["25%", "25%", "25%", "25%"] }

    getInitialDirectoryWidths() { return ["34%", "33%", "33%"] }

    getDrivesColumns(widths: string[]) {
        return [
            { name: "Beschreibung", width: widths[0] },
            { name: "Name", width: widths[1] },
            { name: "Mountpoint", width: widths[2] },
            { name: "Größe", width: widths[3], rightAligned: true }            
        ]
    } 

    getDirectoryColumns(widths: string[]) {
        return [
            { name: "Name", isSortable: true, width: widths[0], subItem: "Erw." },
            { name: "Datum", isSortable: true, width: widths[1], isExif: true},
            { name: "Größe", isSortable: true, width: widths[2], rightAligned: true }            
        ]
    } 

    getDriveColumnItems(item: DriveItem) {
        return { 
            display: item.name, 
            columns: [
                item.description,
                item.mountPoint,
                formatSize(item.size)
            ]
        }
    }

    getDirectoryColumnItems(item: FileItem) {
        return {
            display: item.name, 
            icon: path.extname(item.name) || "unknown",
            columns: [
                item.time ? formatDate(item.time) : "",
                item.size ? formatSize(item.size) : ""
            ]
        }
    }
}