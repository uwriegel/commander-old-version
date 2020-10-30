<template>	
	<div id="app" v-stream:keydown.native='keyDown$'>
		<splitter-grid :isVertical=true :isSecondInvisible="!showViewer" 
			@splitter-position-changed="viewerHeightChanged">
			<template v-slot:first>
				<splitter-grid>
					<template v-slot:first>
						<folder-view :eventBus="folderLeftEventBus" :name="'folderLeft'" @pathChanged=pathChanged
							@focus-in=onLeftFocus @selection-changed=selectionChanged></folder-view>
					</template>
					<template v-slot:second>
						<folder-view :eventBus="folderRightEventBus" :name="'folderRight'" @pathChanged=pathChanged
							@focus-in=onRightFocus @selection-changed=selectionChanged></folder-view>
					</template>
				</splitter-grid>
			</template>
			<template v-slot:second>
                <viewer class="viewer" :src=selectedItem></viewer>
            </template>			
		</splitter-grid>
		<div class="status">{{ selectedItem }}</div>
        <vue-dialog-box ref="dialog" @state-changed=onDialogStateChanged>
            <!-- <text-input-dialog ref=textinput v-if="textInput"></text-input-dialog> -->
        </vue-dialog-box>
	</div>
</template>
<script lang="ts">
import Vue from 'vue'
import { filter } from "rxjs/operators"
import FolderView from './components/FolderVue.vue'
import Viewer from './components/Viewer.vue'

enum Theme {
    blue,
    yaru,
    yarudark
}

interface CommanderMessage {
  	method: string
}

interface ThemeMsg extends CommanderMessage {
  	theme: string
}

interface ShowViewerMsg extends CommanderMessage {
  	showViewer: boolean
}

enum OutMsgType {
	PathChanged = "PathChanged",
    ThemeChanged = "ThemeChanged",
    ShowDevTools = "ShowDevTools",
    ToggleFullScreen = "ToggleFullScreen",
    Exit = "Exit"
}

interface OutMsg {
    case: OutMsgType
    fields: string[]
}

var sendPathChanges = false

export default Vue.extend({
name: 'app',
    components: {
        FolderView,
        Viewer
	},
    data() {
		return {
			folderLeftEventBus: new Vue(),
			folderRightEventBus: new Vue(),
			leftHasFocus: false,
            showViewer: false,
            showHidden: false,
            theme: Theme.blue,
            selectedItem: "",
            basePath: "",
            dialogOpen: false,
			ws: new WebSocket("ws://localhost:9865/commander"),
			acceleratorMap: new Map(),		
			menuItems: (this as any).getMenu()
		}
	},
	domStreams: ["keyDown$"],
    mounted: function () {
      	let i = 0
		this.folderLeftEventBus.$emit("focus") 

		const tabs$ = (this as any).keyDown$.pipe(filter((evt: any) => evt.event.which == 9 && !evt.event.shiftKey))
		this.$subscribeTo(tabs$, (evt: any) => {
			evt.event.stopPropagation()
			evt.event.preventDefault()
			this.getInactiveFolder().$emit("focus")
        })

        // TODO:IPC
        // const { ipcRenderer } = window.require('electron')
        // for (let i = 0; i <= 1_000_000; i++)
        //     ipcRenderer.send('ping', i)

        // let index = 0
      	this.ws.onmessage = m => {
			let msg = JSON.parse(m.data) as CommanderMessage
			switch (msg.method) {
                case "changeTheme":
                    const themeMsg = msg as ThemeMsg
                    const getTheme = () => {
                        switch (themeMsg.theme) {
                        case "yaru":
                            return Theme.yaru
                        case "yarudark": 
                            return Theme.yarudark 
                        default:
                            return Theme.blue
                        }
                    }

                    this.theme = getTheme()
                    this.changeTheme()
                    break
				case "wantPathChanges":
					sendPathChanges = true
					break
				default:
					console.log("Msg", msg)
					break
			}
	    }
	},
	methods: {
		onLeftFocus() { 
			this.leftHasFocus = true 
			//this.selectedItem = this.$refs.leftFolder.getSelectedItem()
		},
		onRightFocus() { 
			this.leftHasFocus = false 
		},
		getActiveFolder() {
            return this.leftHasFocus ? this.folderLeftEventBus : this.folderRightEventBus
        },
        getInactiveFolder() {
            return this.leftHasFocus ? this.folderRightEventBus : this.folderLeftEventBus
		},
		selectionChanged(index: number) {
			this.getActiveFolder().$emit("selectionChanged", index)
		},
		pathChanged(path: string, basePath: string) {
            this.selectedItem = path
            this.basePath = basePath
            const msg: OutMsg = {
                case: OutMsgType.PathChanged,
                fields: [path]
			}
			if (sendPathChanges)
            	this.ws.send(JSON.stringify(msg))
		},
		viewerHeightChanged() {
    		this.folderLeftEventBus.$emit("resize")
			this.folderRightEventBus.$emit("resize")
        },	
        onDialogStateChanged(isShowing: boolean) { this.dialogOpen = isShowing },	
		rename() { console.log("Rename", this)},
        extendedRename() { console.log("Extended Rename", this)},		
        openSameFolder() {
            this.getInactiveFolder().$emit("path", this.basePath)
        },
        changeTheme() {
            const styleSheet = document.getElementById("theme")  
            if (styleSheet)
                styleSheet.remove()

            const getTheme = () => {
                switch (this.theme) {
                case Theme.blue: 
                    return "blue"
                case Theme.yaru: 
                    return "yaru"
                case Theme.yarudark: 
                    return "yarudark"
                }
            }

            const head = document.getElementsByTagName('head')[0]
            let link = document.createElement('link')
            link.rel = 'stylesheet'
            link.id = 'theme'
            link.type = 'text/css'
            link.href = `http://localhost:9865/assets/themes/${getTheme()}.css`
            link.media = 'all'
            head.appendChild(link)
            this.folderLeftEventBus.$emit("themeChanged")
            this.folderRightEventBus.$emit("themeChanged")

            const theme = 
                this.theme == Theme.yaru
                ? "yaru"
                : this.theme == Theme.yarudark
                    ? "yarudark"
                    : "blue"
            const msg: OutMsg = {
                case: OutMsgType.ThemeChanged,
                fields: [theme]
			}
          	this.ws.send(JSON.stringify(msg))
        },
		getMenu() {
			return [
                {
                    name: "_Datei",
                    subItems: [{ 
                            name: "_Umbenennen",
                            action: () => this.rename(),
                            accelerator: { 
                                name: "F2",
                                key: 113
                            }
                        }, { 
                            name: "Er_weitertes Umbenennen",
                            action: () => this.extendedRename(),
                            accelerator: { 
                                name: "Strg+F2",
                                ctrl: true,
                                key: 113
                            }
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Kopieren",
                            action: () => console.log("Copy"),
                            accelerator: { 
                                name: "F5",
                                key: 116
                            }
                        }, { 
                            name: "_Verschieben",
                            action: () => console.log("Move"),
                            accelerator: { 
                                name: "F6",
                                key: 117
                            }
                        }, { 
                            name: "_Löschen",
                            accelerator: { name: "Entf"},
                            action: async () => {
                                const ret = await (this.$refs.dialog as any).show({
                                    ok: true, 
                                    cancel : true,
                                    defButton: "ok",
                                    text: "Wollen Sie nichts löschen?", 
                                })
                                console.log(ret)
                            },                                
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Ordner anlegen",
                            accelerator: { 
                                name: "F7",
                                key: 118
                            },
                            action: () => console.log("CreateFolder"),
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Eigenschaften",
                            action: () => console.log("Properties"),
                            accelerator: { 
                                name: "Alt+Enter",
                                key: 13,
                                alt: true
                            }
                        }, { 
                            name: "Öffnen _mit",
                            action: () => console.log("OpenAs"),
                            accelerator: { 
                                name: "Strg+Enter",
                                key: 13,
                                ctrl: true
                            }
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Beenden",
                            action: () => {
                                const msg: OutMsg = {
                                    case: OutMsgType.Exit,
                                    fields: []
                                }
                                this.ws.send(JSON.stringify(msg))
                            },
                            accelerator: { name: "Alt+F4"}
                        }
                    ]
                }, 
                {
                    name: "_Navigation",
                    subItems: [{ 
                            name: "_Favoriten",
                            accelerator: { name: "F1"}
                        }, { 
                            name: "_Gleichen Ordner öffnen",
                            action: () => this.openSameFolder(),
                            accelerator: { 
                                name: "F9",
                                key: 120,
                            }
                        }
                    ]
                }, 
                {
                    name: "_Selektion",
                    subItems: [{ 
                            name: "_Alles",
                            accelerator: { name: "Num +"}
                        }, { 
                            name: "Alle _deselektieren",
                            accelerator: { name: "Num -"}
                        }
                    ]
                }, 
                {
                    name: "_Ansicht",
                    subItems: [{ 
                            name: "_Versteckte Dateien",
                            action: () => {
                                this.showHidden = !this.showHidden,
                                this.folderLeftEventBus.$emit("showHidden", this.showHidden)
                                this.folderRightEventBus.$emit("showHidden", this.showHidden)
                            },
                            checkSelected: () => this.showHidden,
                            accelerator: { 
                                name: "Strg+H",
                                key: 72,
                                ctrl: true
                            }
                        }, { 
                            name: "_Aktualisieren",
                            action: () => {
            					this.folderLeftEventBus.$emit("refresh")
					            this.folderRightEventBus.$emit("refresh")
                            },
                            accelerator: { 
                                name: "Strg+R",
                                key: 82,
                                ctrl: true
                            }
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Vorschau",
                            action: () => this.showViewer = !this.showViewer,
                            checkSelected: () => this.showViewer,
                            accelerator: { 
                                name: "F3",
                                key: 114,
                            }
                        }, { 
                            name: "-"
                        }, {
                            name: "_Themen ->",
                            subMenu: [{ 
                                name: "<- _Zurück",
                                back: true
                            }, { 
                                name: "-"
                            }, { 
                                name: "_Blau",
                                action: () => {
                                    this.theme = Theme.blue
                                    this.changeTheme()
                                },
                                checkSelected: () => this.theme == Theme.blue,
                            }, {
                                name: "_Yaru",
                                action: () => {
                                    this.theme = Theme.yaru
                                    this.changeTheme()
                                },
                                checkSelected: () => this.theme == Theme.yaru,
                            }, {
                                name: "_Yaru-dark",
                                action: () => {
                                    this.theme = Theme.yarudark
                                    this.changeTheme()
                                },
                                checkSelected: () => this.theme == Theme.yarudark,
                            }
                        ]}, { 
                            name: "-"
                        }, {
                            name: "_Zoomlevel"
                        }, { 
                            name: "_Vollbild",
                            action: () => {
                                const msg: OutMsg = {
                                    case: OutMsgType.ToggleFullScreen,
                                    fields: []
                                }
                                this.ws.send(JSON.stringify(msg))
                            },
                            accelerator: { 
                                name: "F11",
                                key: 122
                            }
                        }, { 
                            name: "-"
                        }, { 
                            name: "_Entwicklerwerkzeuge",
                            action: () => {
                                const msg: OutMsg = {
                                    case: OutMsgType.ShowDevTools,
                                    fields: []
                                }
                                this.ws.send(JSON.stringify(msg))
                            },
                            accelerator: { 
                                name: "F12",
                                key: 123
                            }
                        }
                    ]
                }
            ]
        },
        menuResize() { 
       		this.folderLeftEventBus.$emit("resize")
			this.folderRightEventBus.$emit("resize")
        }
	}
})
</script>

<style>


:root {
    --vue-menu-color: black;
    --vue-menu-background-color: white;
    --vue-menu-hover-color: lightblue;
    --vue-menu-separator-color: #ddd;
    --vue-menu-border-color: lightgray;
    --vue-menu-shadow-color: rgba(0, 0, 0, 0.21);
    --vue-menu-selected-background-color: blue;
    --vue-menu-selected-color: white;
}

body {
    background-color: var(--main-background-color);
    color: var(--main-color); 
    font-size: var(--font-size);
    font-family: sans-serif;
    overflow:hidden;
    height: 100vh;
    padding: 0px;
    margin: 0px;    
}
#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
}
.dialogOpen {
    filter: blur(1px);
}
.status {
    padding: 2px 2px 1px 5px;
    height: 14px; 
    color: var(--selected-color);
    background-color: var(--selected-background-color);
}
.hidden {
	display: none;
}
.viewer {
    flex-grow: 1;
}
</style>

