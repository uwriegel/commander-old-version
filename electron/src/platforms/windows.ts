import { Drive, RootType } from "../processors/root"
import { IPlatform } from "./platform"
import { getDrives } from 'filesystem-utilities'
import { formatSize } from "../processors/processor"

export class Windows implements IPlatform {
    getInitialDrivesWidths() { return ["33%", "33%", "33%"] }
    getDrivesColumns(widths: string[]) {
        return [
            { name: "Beschreibung", isSortable: false, width: widths[0], rightAligned: false, isExif: false },
            { name: "Name", isSortable: false, width: widths[1], rightAligned: false, isExif: false },
            { name: "Größe", isSortable: false, width: widths[3], rightAligned: true, isExif: false }            
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