import { exec } from "child_process"
import { Drive } from "processors/root"
import { Column } from "../model/model"
import { Linux } from "./linux"

export interface IPlatform {
    getInitialDrivesWidths(): string[]
    getDrives(): Promise<Drive[]>
    getDrivesColumns(width: string[]): Column[]
}

export const platformMethods: IPlatform = new Linux()

export function runCmd(cmd: string) {
    return new Promise<string>((res, rej) => 
        exec(cmd, (err, stdout, stderr) => res(stdout))
    )
}

