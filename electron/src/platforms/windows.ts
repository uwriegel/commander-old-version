import { Protocol } from "electron"
import { getIcon, getFileVersion } from 'filesystem-utilities'
import * as ioPath from 'path'
import { IPlatform } from "./platform"
import { formatDate, formatSize, splitFilename } from "../processors/processor"
import { ICON_SCHEME, Sort } from "../model/model"
import { DirectoryItem } from "../processors/directory"
import { ROOT } from "../processors/root"
import _ = require("lodash")

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

    getDriveItemPath = (item: DriveItem) => item.name

    getDriveColumnItems = (item: DriveItem) => ({
        display: item.name,
        columns: [
            item.description,
            formatSize(item.size)
        ]
    })

    getDirectoryColumnItems = (item: DirectoryItem, path: string) => {
        const [name, ext] = splitFilename(item.name)
        return {
            display: name,
            icon: `icon?path=${encodeURIComponent(ioPath.join(path, item.name))}`,
            columns: [
                ext,
                item.time ? formatDate(item.time) : "",
                item.size ? formatSize(item.size) : "",
                item.version ? `${item.version.major}.${item.version.minor}.${item.version.patch}${item.version.build}` : ""
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
    
    getExtendedInfos = async (items: DirectoryItem[], path: string, refresh: ()=>void) => {
        const exes = items.filter(n => n.name.toLowerCase().endsWith(".dll") || n.name.toLowerCase().endsWith(".exe"))
        for (let i = 0; i < exes.length; i++) {
            const exe = exes[i]
            exe.version = await getFileVersion(ioPath.join(path, exe.name))
        }
        refresh()
    }    
    
    getSelectedFolder = (lastPath: string, path: string) => path == ROOT ? lastPath : null

    getDriveID = (drive: DriveItem) => drive.name

    sortFiles = (files: DirectoryItem[], sort: Sort) => {
        switch (sort.column) {
            case 0:
                return _.orderBy(files, [file => file.name.toLowerCase()], [sort.descending ? 'desc' : 'asc'])
            
            
            case 2:
                return _.orderBy(files, ['time'], [sort.descending ? 'desc' : 'asc'])
            case 3:
                return _.orderBy(files, ['size'], [sort.descending ? 'desc' : 'asc'])
            case 4:
                return _.orderBy(files, [file => file.version.major, file => file.version.minor, file => file.version.patch, file => file.version.build])
        }
        return files
    }
}