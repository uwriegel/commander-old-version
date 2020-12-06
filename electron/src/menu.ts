import { BrowserWindow, Menu } from "electron"
import { leftFolder, rightFolder, sendToApp } from "./main"
import { MainAppMsgType, THEME_BLUE, THEME_YARU, THEME_YARUDARK } from "./model/model"

var theme = ""
export var showHidden = false
var showPreview = false

export const setInitialTheme = (themeToSet: string) => theme = themeToSet

export const createMenuBar = (win: BrowserWindow) => {
    const setTheme = (themeToSet: string) => {
        theme = themeToSet
        sendToApp(MainAppMsgType.SetTheme, theme)
    }

    const menu = Menu.buildFromTemplate([
        {
            label: '&Datei',
            submenu: [{
                label: '&Umbenennen',
                accelerator: 'F2',
            }, {
                label: 'Er&weitertes Umbenennen',
                accelerator: 'Ctrl+F2',
            }, {
                type: 'separator'
            }, {
                label: '&Kopieren',
                accelerator: 'F5',
            }, {
                label: '&Verschieben',
                accelerator: 'F6',
            }, {
                label: '&Löschen',
                accelerator: 'Del',
                click: () => sendToApp(MainAppMsgType.Delete)
            }, {
                type: 'separator'
            }, {
                label: '&Ordner anlegen',
                accelerator: 'F7',
                click: () => sendToApp(MainAppMsgType.CreateFolder)
            }, {
                type: 'separator'
            }, {
                label: '&Eigenschaften',
                accelerator: 'Alt+Enter',
            }, {
                label: 'Öffnen &mit',
                accelerator: 'Ctrl+Enter',
            }, {
                type: 'separator'
            }, {
                label: '&Beenden',
                accelerator: 'Alt+F4',
                role: "quit"
            }]
        }, {
            label: '&Navigation',
            submenu: [{
                label: '&Favoriten',
                accelerator: 'F1',
            }, {
                label: '&Gleichen Ordner öffnen',
                accelerator: 'F9',
                click: () => sendToApp(MainAppMsgType.OpenSameFolder)
            }]
        }, {
            label: '&Selektion',
            submenu: [{
                label: '&Alles',
                accelerator: 'Num +',
            }, {
                label: 'Alle &deselektieren',
                accelerator: 'Num -',
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
                    leftFolder.refresh()
                    rightFolder.refresh()
                }
            }, {
                label: '&Vorschau',
                type: "checkbox",
                checked: showPreview,
                accelerator: 'F3',
                click: () => {
                    showPreview = !showPreview
                    sendToApp(MainAppMsgType.Preview, showPreview)
                }
            }, {
                type: 'separator'
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