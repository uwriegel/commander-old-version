import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import * as settings from 'electron-settings'
import * as path from 'path'
import * as http from 'http'
import * as fs from 'fs'
import { createMenuBar, setInitialTheme } from './menu'
import { Folder } from './folder'
import { CHANNEL_TO_RENDERER, ICON_SCHEME, MainAppMsgType } from './model/model'
import { platformMethods } from './platforms/platform'
const fsa = fs.promises

export var leftFolder: Folder
export var rightFolder: Folder

export var sendToApp: (msg: MainAppMsgType, ...args: any[])=>void

const PREVIEW_SCHEME = "preview"

const debug = process.env.NODE_ENV == 'development'
let mainWindow: BrowserWindow

console.log("Starting electron app")

protocol.registerSchemesAsPrivileged([{
	scheme: ICON_SCHEME, privileges: { standard: true, secure: true }
}])

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup'))  // eslint-disable-line global-require
	app.quit()

ipcMain.on('ready', (_, theme: string) => {
	setInitialTheme(theme)
	createMenuBar(mainWindow)
	mainWindow.show() 
})
	
const createWindow = () => { 
	// Create the browser window.
    let bounds = (settings.getSync("window-bounds") || { 
        width: 600,
        height: 800,
	}) as Electron.BrowserWindowConstructorOptions

	bounds.webPreferences = { nodeIntegration: true }    
	bounds.show = false 
	bounds.icon = path.join(__dirname, '..', '..', 'public', 'kirk2.png')
	bounds.backgroundColor = "#fff"
	mainWindow = new BrowserWindow(bounds)
	sendToApp = (msg: MainAppMsgType, ...args: any[])=> mainWindow.webContents.send(CHANNEL_TO_RENDERER, msg, args)

	platformMethods.registerIconServer(protocol)

	protocol.registerFileProtocol(PREVIEW_SCHEME, async (request, callback) => {
		try {
			const path = decodeURIComponent(request.url.substring(17))
			callback(path)
		} catch (err) {
			console.error("Could not get icon", err)
		}
	})

	leftFolder = new Folder(ipcMain, mainWindow.webContents, "folderLeft")
	rightFolder = new Folder(ipcMain, mainWindow.webContents, "folderRight")

	if (debug)
        require('vue-devtools').install() 

	mainWindow.loadURL(debug ? "http://localhost:8080" : "http://localhost:8080")
    mainWindow.on('close', () => {
        if (!mainWindow.isMaximized()) {
            const bounds = mainWindow.getBounds()
            settings.setSync("window-bounds", bounds as any)
        }
    })

	mainWindow.setAutoHideMenuBar(true)
	mainWindow.setMenuBarVisibility(false)
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform != 'darwin') 
		app.quit()
})

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length == 0) 
		createWindow()
	
})

http.createServer(async (req, res) => {
	try {
		const path = decodeURIComponent(req.url!)
		const data = await fsa.readFile(path)	
		res.writeHead(200)
		res.end(data)
	} catch (err) { console.log(err) }
}).listen(20000)
