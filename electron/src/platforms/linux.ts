import { formatSize } from "../processors/processor"
import { IPlatform } from "./platform"

export class Linux implements IPlatform {
    getInitialDrivesWidths() { return ["25%", "25%", "25%", "25%"] }

    getInitialDirectoryWidths() { return ["34%", "33%", "33%"] }

    getDrivesColumns(widths: string[]) {
        return [
            { name: "Beschreibung", isSortable: false, width: widths[0], rightAligned: false, isExif: false },
            { name: "Name", isSortable: false, width: widths[1], rightAligned: false, isExif: false },
            { name: "Größe", isSortable: false, width: widths[3], rightAligned: true, isExif: false }            
        ]
    } 

    getDirectoryColumns(widths: string[]) {
        return [
            { name: "Name", isSortable: true, width: widths[0], rightAligned: false, isExif: false, subItem: "Erw." },
            { name: "Datum", isSortable: true, width: widths[1], rightAligned: false, isExif: true},
            { name: "Größe", isSortable: true, width: widths[2], rightAligned: true, isExif: false }            
        ]
    } 

    getDriveColumnItems(item: DriveItem) {
        return [
            item.description,
            item.mountPoint,
            formatSize(item.size)
        ]
    }

    getDirectoryColumnItems(item: FileItem) {
        return [
            // TODO: time format
            item.time ? item.time.toString() : "",
            item.size ? formatSize(item.size) : ""
        ]
    }
}