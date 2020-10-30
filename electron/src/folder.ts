import { IpcMain } from "electron"

export class Folder {
    constructor(ipcMain: IpcMain, name: string) {
        this.ipcMain = ipcMain
        this.name = name

        ipcMain.on(name, async (_, args) => {
            console.log("Arks", args)
            console.log("Arks", args.method, args.count)

            // TODO: | Init folderName -> 
            // TODO: session <- init folderName session 
            // TODO: changePath session.Path None true            
        })
    }

    ipcMain: IpcMain
    name: string
}