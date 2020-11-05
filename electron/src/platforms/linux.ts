import { formatSize } from "../processors/processor"
import { Drive, RootType } from "../processors/root"
import { IPlatform, runCmd } from "./platform"

export class Linux implements IPlatform {
    getInitialDrivesWidths() { return ["25%", "25%", "25%", "25%"] }

    getInitialDirectoryWidths() { return ["34%", "33%", "33%"] }

    getDrivesColumns(widths: string[]) {
        return [
            { name: "Name", isSortable: true, width: widths[0], rightAligned: false, isExif: false, subItem: "Erw." },
            { name: "Datum", isSortable: true, width: widths[1], rightAligned: false, isExif: true},
            { name: "Größe", isSortable: true, width: widths[2], rightAligned: true, isExif: false }            
        ]
    } 

    getDirectoryColumns(widths: string[]) {
        return [
            { name: "Beschreibung", isSortable: false, width: widths[0], rightAligned: false, isExif: false },
            { name: "Name", isSortable: false, width: widths[1], rightAligned: false, isExif: false },
            { name: "Größe", isSortable: false, width: widths[3], rightAligned: true, isExif: false }            
        ]
    } 
    
    async getDrives() {
        const drivesString = await runCmd('lsblk --bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE')
        const driveStrings = drivesString.split("\n")
        const columnsPositions = (() => {
            const title = driveStrings[0]
            const getPart = (key: string) => title.indexOf(key) 

            return [ 
                0,
                getPart("NAME"), 
                getPart("LABEL"),
                getPart("MOUNT"),
                getPart("FSTYPE")
            ]
        })()         

        const takeOr = (text: string, alt: string) => text ? text : alt
        const constructDrives = (driveString: string) => {
            const getString = (pos1: number, pos2: number) => 
                driveString.substring(columnsPositions[pos1], columnsPositions[pos2]).trim()
            const trimName = (name: string) => 
                name.length > 2 && name[1] == '─' 
                ? name.substring(2)
                : name
            const mount = getString(3, 4)
            
            return {
                name: takeOr(getString(2, 3), mount),
                description: trimName(getString(1, 2)),
                type: RootType.HardDrive, // TODO: Drive types
                mountPoint: mount,
                driveType: driveString.substring(columnsPositions[4]).trim(),
                size: parseInt(getString(0, 1), 10)
            }
        }   

        return driveStrings
            .slice(1)
            .map(constructDrives)
            .filter(n => n.mountPoint && !n.mountPoint.startsWith("/snap"))        
    }

    getColumnItems(item: Drive) {
        return [
            item.description,
            item.mountPoint,
            formatSize(item.size)
        ]
    }
}