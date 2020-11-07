import { Protocol } from 'electron'
import { getIcon } from 'filesystem-utilities'
import { ICON_SCHEME } from '../model/model'
import * as path from 'path'
import { formatDate, formatSize } from "../processors/processor"
import { IPlatform } from "./platform"

export class Linux implements IPlatform {
    getInitialDrivesWidths = () => [ "25%", "25%", "25%", "25%"] 
    getInitialDirectoryWidths = () => ["34%", "33%", "33%"] 

    getDrivesColumns = (widths: string[]) => [
        { name: "Beschreibung", width: widths[0] },
        { name: "Name", width: widths[1] },
        { name: "Mountpoint", width: widths[2] },
        { name: "Größe", width: widths[3], rightAligned: true }            
    ]

    getDirectoryColumns = (widths: string[]) => [
        { name: "Name", isSortable: true, width: widths[0], subItem: "Erw." },
        { name: "Datum", isSortable: true, width: widths[1], isExif: true},
        { name: "Größe", isSortable: true, width: widths[2], rightAligned: true }            
    ]

    getDriveColumnItems = (item: DriveItem) => ({
        display: item.name, 
        columns: [
            item.description,
            item.mountPoint,
            formatSize(item.size)
        ]
    })

    getDirectoryColumnItems = (item: FileItem) => ({
        display: item.name, 
        icon: path.extname(item.name) || "unknown",
        columns: [
            item.time ? formatDate(item.time) : "",
            item.size ? formatSize(item.size) : ""
        ]
    })

    registerIconServer = (protocol: Protocol) => {
        protocol.registerFileProtocol(ICON_SCHEME, async (request, callback) => {

            const getDefaultIcon = () => callback(path.join(__dirname, "../../assets/images/fault.png"))

            try {
                const icon = request.url.substring(ICON_SCHEME.length + 3, request.url.length - 1)
                const result = await getIcon(icon) as string
                if (result != "None") 
                    callback(result)
                else
                    getDefaultIcon()
            } catch (err) {
                console.error("Could not get icon", err)
                getDefaultIcon()
            }
        })
    }
}