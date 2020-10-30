import { BrowserWindow, Menu } from "electron"
import * as settings from 'electron-settings'

const THEME_BLUE = "blue"
const THEME_YARU = "yaru"
const THEME_YARUDARK = "yarudark"
export const THEME_DEFAULT = THEME_BLUE

var theme = settings.getSync("theme") || THEME_DEFAULT

export function createMenuBar(win: BrowserWindow) {

    function setTheme(themeToSet: string) {
        theme = themeToSet
        win.webContents.send("changeTheme", theme)
        settings.set("theme", theme)
    }

    const menu = Menu.buildFromTemplate([
        {
            label: '&Datei',
            submenu: [{
                label: '&Beenden',
                accelerator: 'Alt+F4',
                role: "quit"
            }]
        }, {
            label: '&Ansicht',
            submenu: [{
                label: '&Themen',
                type: "submenu",
                submenu: [{
                    label: '&Blau',
                    type: "radio",
                    checked: theme == THEME_BLUE,
                    click: evt => setTheme(THEME_BLUE)
                }, {
                    label: '&Yaru',
                    type: "radio",
                    checked: theme == THEME_YARU,
                    click: evt => setTheme(THEME_YARU)
                }, {
                    label: 'Yaru &dark',
                    type: "radio",
                    checked: theme == THEME_YARUDARK,
                    click: evt => setTheme(THEME_YARUDARK)
                }]
            }, {
                type: 'separator'
            }, {
                label: '&Vollbild',
                click: () => win.setFullScreen(!win.isFullScreen()),
                accelerator: "F11"
            }, {
                type: 'separator'
            }, {
                label: '&Entwicklerwerkzeuge',
                click: () => win.webContents.openDevTools(),
                accelerator: "F12"
            }]
        }                
    ])    
    Menu.setApplicationMenu(menu)  
}