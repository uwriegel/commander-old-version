import { Protocol } from 'electron'
import { getIcon } from 'filesystem-utilities'
import { ICON_SCHEME } from '../model/model'
import * as ioPath from 'path'
import { formatDate, formatSize } from "../processors/processor"
import { IPlatform } from "./platform"
import { DirectoryItem } from 'processors/directory'

export class Linux implements IPlatform {
    getInitialDrivesWidths = () => [ "25%", "25%", "25%", "25%"] 
    getInitialDirectoryWidths = () => ["34%", "33%", "33%"] 

    getDrivesColumns = (widths: string[]) => [
        { name: "Beschreibung", width: widths[0] },
        { name: "Name", width: widths[1] },
        { name: "Mountpoint", width: widths[2] },
        { name: "Größe", width: widths[3], rightAligned: true }            
    ]

    getDriveItemPath = (item: DriveItem) => item.mountPoint

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

    getDirectoryColumnItems = (item: DirectoryItem, path: string) => ({
        display: item.name, 
        icon: `icon?path=${encodeURIComponent(ioPath.extname(item.name) || "unknown")}` ,
        columns: [
            item.exifDate 
            ? formatDate(item.exifDate)
            : item.time 
                ? formatDate(item.time) 
                : "",
            item.size ? formatSize(item.size) : ""
        ]
    })

    registerIconServer = (protocol: Protocol) => {
        protocol.registerFileProtocol(ICON_SCHEME, async (request, callback) => {

            const getDefaultIcon = () => callback(ioPath.join(__dirname, "../../assets/images/fault.png"))

            try {
                const path = decodeURIComponent(request.url.substring(18))
                const result = await getIcon(path) as string
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

    getExtendedInfos = (items: DirectoryItem[], path: string, refresh: ()=>void) => {}

    getSelectedFolder = (lastPath: string, path: string) => null

    getDriveID = (drive: DriveItem) => drive.mountPoint
}