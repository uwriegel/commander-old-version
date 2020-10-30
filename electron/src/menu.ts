import { BrowserWindow, Menu } from "electron"

export function createMenuBar(win: BrowserWindow) {
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
//                    checked: theme == themeBlue,
  //                  click: evt => setTheme(themeBlue)
                }, {
                    label: '&Hellblau',
                    type: "radio",
//                    checked: theme == themeLightBlue,
//                    click: evt => setTheme(themeLightBlue)
                }, {
                    label: '&Dunkel',
                    type: "radio",
//                    checked: theme == themeDark,
//                    click: evt => setTheme(themeDark)
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