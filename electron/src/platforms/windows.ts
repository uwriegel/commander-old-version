import { Protocol } from "electron"
import { getIcon } from 'filesystem-utilities'
import * as ioPath from 'path'
import { IPlatform } from "./platform"
import { formatDate, formatSize, splitFilename } from "../processors/processor"
import { ICON_SCHEME } from "../model/model"

export class Windows implements IPlatform {
    getInitialDrivesWidths = () => ["33%", "34%", "33%"] 

    getInitialDirectoryWidths = () => ["20%", "20%", "20%", "20%", "20%"] 

    getDrivesColumns = (widths: string[]) => [
        { name: "Beschreibung", width: widths[0] },
        { name: "Name", width: widths[1] },
        { name: "Größe", width: widths[3] }            
    ]
    
    getDirectoryColumns = (widths: string[]) => [
        { name: "Name", isSortable: true, width: widths[0] },
        { name: "Erw.", isSortable: true, width: widths[1] },
        { name: "Datum", isSortable: true, width: widths[2], isExif: true },            
        { name: "Größe", isSortable: true, width: widths[3], rightAligned: true },           
        { name: "Version", isSortable: true, width: widths[4] }            
    ]

    getDriveColumnItems = (item: DriveItem) => ({
        display: item.name,
        columns: [
            item.description,
            formatSize(item.size)
        ]
    })

    getDirectoryColumnItems = (item: FileItem, path: string) => {
        const [name, ext] = splitFilename(item.name)
        return {
            display: name,
            icon: `icon?path=${encodeURIComponent(ioPath.join(path, item.name))}`,
            columns: [
                ext,
                item.time ? formatDate(item.time) : "",
                item.size ? formatSize(item.size) : ""
            ]
        }
    }

    registerIconServer = (protocol: Protocol) => {
        protocol.registerBufferProtocol(ICON_SCHEME, async (request, callback) => {
            const path = decodeURIComponent(request.url.substring(18))
            const img = await getIcon(path) as Buffer
            callback(img)
        })
    }
}