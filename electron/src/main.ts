import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import { createMenuBar, THEME_DEFAULT } from './menu'
import * as path from 'path'
import * as settings from 'electron-settings'
import { Folder } from './folder'
import { ICON_SCHEME } from './model/model'
import { spawn } from 'child_process'

const debug = process.env.NODE_ENV == 'development'
let mainWindow: BrowserWindow

console.log("Starting electron app")

protocol.registerSchemesAsPrivileged([{
	scheme: ICON_SCHEME, privileges: { standard: true, secure: true }
}])

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup'))  // eslint-disable-line global-require
	app.quit()

ipcMain.on('ready', async (_, __) => {
	const theme = await settings.get("theme") || THEME_DEFAULT
	mainWindow.webContents.send("changeTheme", theme)
})

const createWindow = async () => { 
	// Create the browser window.
    let bounds = (await settings.get("window-bounds") || { 
        width: 600,
        height: 800,
	}) as Electron.BrowserWindowConstructorOptions

	const isLightMode = true

	bounds.webPreferences = { nodeIntegration: true }    
	bounds.icon = path.join(__dirname, '..', '..', 'public', 'kirk2.png')
	bounds.backgroundColor = isLightMode ? "#fff" : "#1e1e1e" 
	mainWindow = new BrowserWindow(bounds)

	protocol.registerFileProtocol(ICON_SCHEME, (request, callback) => {
		const icon = request.url.substring(ICON_SCHEME.length + 3, request.url.length - 1)
		const process = spawn('python3',[ path.join(__dirname, "../assets/python/getIcon.py"), icon ])
    	process.stdout.on('data', (data: Buffer) => {
	        const icon = data.toString('utf8').trim()
  			if (icon != "None") 
				callback(icon)
        	else
				callback(path.join(__dirname, "../assets/images/fault.png"))
		})
		process.stderr.on('data', (data: Buffer) => 
			console.error("get icon", data.toString('utf8').trim())
		)
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

	createMenuBar(mainWindow)
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
var leftFolder: Folder
var rightFolder: Folder

