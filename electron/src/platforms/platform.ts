import { exec } from "child_process"
import { Drive } from "processors/root"
import { Column } from "../model/model"
import { Linux } from "./linux"
import * as process from "process"
import { Windows } from "./windows"

enum Platform {
    Linux,
    Windows
}

const PLATFORM = (() => 
    process.platform == "linux" 
    ? Platform.Linux 
    : Platform.Windows)()

export interface IPlatform {
    getInitialDrivesWidths(): string[]
    getInitialDirectoryWidths(): string[]
    getDrives(): Promise<Drive[]>
    getDrivesColumns(width: string[]): Column[]
    getDirectoryColumns(width: string[]): Column[]
    getDriveColumnItems(item: Drive): string[]
    getDirectoryColumnItems(item: FileItem): string[]
}

export const platformMethods: IPlatform = 
    PLATFORM == Platform.Linux
    ? new Linux()
    : new Windows()

export function runCmd(cmd: string) {
    return new Promise<string>((res, rej) => 
        exec(cmd, (err, stdout, stderr) => res(stdout))
    )
}


