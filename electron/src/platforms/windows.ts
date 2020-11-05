import { getDrives } from 'filesystem-utilities'
import { Drive, RootType } from "../processors/root"
import { IPlatform } from "./platform"
import { formatSize } from "../processors/processor"

export class Windows implements IPlatform {
    getInitialDrivesWidths() { return ["33%", "34%", "33%"] }

    getInitialDirectoryWidths() { return ["20%", "20%", "20%", "20%", "20%"] }

    getDrivesColumns(widths: string[]) {
        return [
            { name: "Beschreibung", isSortable: false, width: widths[0], rightAligned: false, isExif: false },
            { name: "Name", isSortable: false, width: widths[1], rightAligned: false, isExif: false },
            { name: "Größe", isSortable: false, width: widths[3], rightAligned: true, isExif: false }            
        ]
    } 

    getDirectoryColumns(widths: string[]) {
        return [
            { name: "Name", isSortable: true, width: widths[0], rightAligned: false, isExif: false },
            { name: "Erw.", isSortable: true, width: widths[1], rightAligned: false, isExif: false },
            { name: "Datum", isSortable: true, width: widths[2], rightAligned: false, isExif: true },            
            { name: "Größe", isSortable: true, width: widths[3], rightAligned: true, isExif: false },           
            { name: "Version", isSortable: true, width: widths[4], rightAligned: false, isExif: false }            
        ]
    } 

    async getDrives() {
        return (await getDrives())
            .map(n => { return {
                name: n.name,
                description: n.description,
                type: RootType.CdRom, // TODO: Drive types
                size: n.size
            }})
    }

    getColumnItems(item: Drive) {
        return [
            item.description,
            formatSize(item.size)
        ]
    }
}