import { Protocol } from "electron"
import { getIcon, getFileVersion } from 'filesystem-utilities'
import * as ioPath from 'path'
import { IPlatform } from "./platform"
import { formatDate, formatSize, splitFilename } from "../processors/processor"
import { ICON_SCHEME, Sort, THEME_BLUE } from "../model/model"
import { DirectoryItem } from "../processors/directory"
import { ROOT } from "../processors/root"
import _ = require("lodash")

export class Windows implements IPlatform {
    getDrivesColumns = () => [
        { name: "Beschreibung" },
        { name: "Name" },
        { name: "Größe" }            
    ]
    
    getDirectoryColumns = () => [
        { name: "Name", isSortable: true },
        { name: "Erw.", isSortable: true },
        { name: "Datum", isSortable: true, isExif: true },            
        { name: "Größe", isSortable: true, rightAligned: true },           
        { name: "Version", isSortable: true }            
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
            case 1:
                return  _.orderBy(files, [file => {
                    const [name, ext] = splitFilename(file.name)
                    return ext ? ext.toLowerCase() : ""
                }, file => file.name.toLowerCase()], [sort.descending ? 'desc' : 'asc', sort.descending ? 'desc' : 'asc'])
            case 2:
                return _.orderBy(files, [ file => file.exifDate ? file.exifDate : file.time ], [sort.descending ? 'desc' : 'asc'])
            case 3:
                return _.orderBy(files, ['size'], [sort.descending ? 'desc' : 'asc'])
            case 4:
                return _.orderBy(files, [
                    file => file.version ? file.version.major : "", 
                    file => file.version ? file.version.minor : "", 
                    file => file.version ? file.version.patch : "",
                    file => file.version ? file.version.build : ""
                ], [
                    sort.descending ? 'desc' : 'asc',
                    sort.descending ? 'desc' : 'asc',
                    sort.descending ? 'desc' : 'asc',
                    sort.descending ? 'desc' : 'asc'
                ])
        }
        return files
    }
}