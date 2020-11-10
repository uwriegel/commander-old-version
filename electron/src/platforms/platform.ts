import { Protocol } from "electron"
import { exec } from "child_process"
import { Column, Sort } from "../model/model"
import { Linux } from "./linux"
import * as process from "process"
import { Windows } from "./windows"
import { DirectoryItem } from "processors/directory"

enum Platform {
    Linux,
    Windows
}

const PLATFORM = (() => 
    process.platform == "linux" 
    ? Platform.Linux 
    : Platform.Windows)()

interface ColumnItem {
    display: string
    icon?: string
    columns: string[]
}

export interface IPlatform {
    getInitialDrivesWidths(): string[]
    getInitialDirectoryWidths(): string[]
    getDrivesColumns(width: string[]): Column[]
    getDirectoryColumns(width: string[]): Column[]
    getDriveItemPath(item: DriveItem): string
    getDriveColumnItems(item: DriveItem): ColumnItem
    getDirectoryColumnItems(item: FileItem, path: string): ColumnItem
    registerIconServer(protocol: Protocol): void
    getExtendedInfos(items: DirectoryItem[], path: string, refresh: ()=>void): void
    getSelectedFolder(lastPath: string, path: string): string
    getDriveID(drive: DriveItem): string
    sortFiles(files: DirectoryItem[], sort: Sort): DirectoryItem[]
}

export const platformMethods: IPlatform = 
    PLATFORM == Platform.Linux
    ? new Linux()
    : new Windows()

export const runCmd = (cmd: string) => {
    return new Promise<string>((res, rej) => 
        exec(cmd, (err, stdout, stderr) => res(stdout))
    )
}


