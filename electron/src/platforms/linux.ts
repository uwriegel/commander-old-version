import { Protocol } from 'electron'
import { getIcon } from 'filesystem-utilities'
import { ICON_SCHEME, Sort, THEME_YARU } from '../model/model'
import * as ioPath from 'path'
import { formatDate, formatSize, splitFilename } from "../processors/processor"
import { IPlatform } from "./platform"
import { DirectoryItem } from 'processors/directory'
import _ = require('lodash')

export class Linux implements IPlatform {

    getDrivesColumns = () => [
        { name: "Beschreibung" },
        { name: "Name" },
        { name: "Mountpoint" },
        { name: "Größe", rightAligned: true }            
    ]

    getDriveItemPath = (item: DriveItem) => item.mountPoint!!

    getDirectoryColumns = () => [
        { name: "Name", isSortable: true, subItem: "Erw." },
        { name: "Datum", isSortable: true, isExif: true},
        { name: "Größe", isSortable: true, rightAligned: true }            
    ]

    getDriveColumnItems = (item: DriveItem) => ({
        display: item.name, 
        columns: [
            item.description,
            item.mountPoint!!,
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

    getDriveID = (drive: DriveItem) => drive.mountPoint!!

    sortFiles = (files: DirectoryItem[], sort: Sort) => {
        switch (sort.column) {
            case 0:
                return sort.subItem != true
                    ? _.orderBy(files, [file => file.name.toLowerCase()], [sort.descending ? 'desc' : 'asc'])
                    : _.orderBy(files, [file => {
                        const [name, ext] = splitFilename(file.name)
                        return ext ? ext.toLowerCase() : ""
                    }, file => file.name.toLowerCase()], [sort.descending ? 'desc' : 'asc', sort.descending ? 'desc' : 'asc'])
            case 1:
                return _.orderBy(files, [ file => file.exifDate ? file.exifDate : file.time ], [sort.descending ? 'desc' : 'asc'])
            case 2:
                return _.orderBy(files, ['size'], [sort.descending ? 'desc' : 'asc'])
        }
        return files
    }
}