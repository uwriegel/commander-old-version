import { IPlatform } from "./platform"

export class Linux implements IPlatform {
    getInitialDrivesWidths() { return ["25%", "25%", "25%", "25%"] }
    getDrivesColumns(widths: string[]) {
        return [
            { name: "Beschreibung", isSortable: false, width: widths[0], rightAligned: false, isExif: false },
            { name: "Name", isSortable: false, width: widths[1], rightAligned: false, isExif: false },
            { name: "Mount", isSortable: false, width: widths[2], rightAligned: false, isExif: false},
            { name: "Größe", isSortable: false, width: widths[3], rightAligned: true, isExif: false }            
        ]
    } 
}