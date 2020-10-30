import { IpcMain } from "electron"

export class Folder {
    constructor(ipcMain: IpcMain, name: string) {
        this.ipcMain = ipcMain
        this.name = name

        ipcMain.on(name, async (_, args) => {
            console.log("Arks", args)
            console.log("Arks", args.method, args.count)
        })
    }

    ipcMain: IpcMain
    name: string
}