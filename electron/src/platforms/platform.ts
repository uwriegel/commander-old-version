import { Column } from "../processors/interfaces"
import { Linux } from "./linux"

export interface IPlatform {
    getInitialDrivesWidths(): string[]
    getDrivesColumns(width: string[]): Column[]
}

export const platformMethods: IPlatform = new Linux()