import { platformMethods } from "../platforms/platform"
import { IProcessor } from "./processor"

export class Root implements IProcessor {
    getColumns() {
        const widths = platformMethods.getInitialDrivesWidths()
        return platformMethods.getDrivesColumns(widths)
    }
}