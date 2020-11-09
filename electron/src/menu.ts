import { BrowserWindow, Menu } from "electron"
import * as settings from 'electron-settings'
import { sendToApp } from "./main"
import { MainAppMsgType } from "./model/model"

const THEME_BLUE = "blue"
const THEME_YARU = "yaru"
const THEME_YARUDARK = "yarudark"
export const THEME_DEFAULT = THEME_BLUE

var theme = settings.getSync("theme") || THEME_DEFAULT
var showHidden = false

export const createMenuBar = (win: BrowserWindow) => {

    const setTheme = (themeToSet: string) => {
        theme = themeToSet
        sendToApp(MainAppMsgType.SetTheme, theme)
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
                label: '&Versteckte Dateien',
                type: "checkbox",
                checked: showHidden,
                accelerator: 'Ctrl+H',
                click: () => {
                    showHidden = !showHidden
                    sendToApp(MainAppMsgType.ShowHidden, showHidden)
                }
            }, {
                label: '&Aktualisieren',
                accelerator: 'Ctrl+R',
                click: () => sendToApp(MainAppMsgType.Refresh)
            }, {
                type: 'separator'
            }, {
                label: '&Themen',
                type: "submenu",
                submenu: [{
                    label: '&Blau',
                    type: "radio",
                    checked: theme == THEME_BLUE,
                    click: () => setTheme(THEME_BLUE)
                }, {
                    label: '&Yaru',
                    type: "radio",
                    checked: theme == THEME_YARU,
                    click: () => setTheme(THEME_YARU)
                }, {
                    label: 'Yaru &dark',
                    type: "radio",
                    checked: theme == THEME_YARUDARK,
                    click: () => setTheme(THEME_YARUDARK)
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