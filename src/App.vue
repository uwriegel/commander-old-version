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
import { Component, Vue } from 'vue-property-decorator'
import { filter } from "rxjs/operators"
import FolderView from './components/FolderVue.vue'
import Viewer from './components/Viewer.vue'
import { Observable, Subject } from 'rxjs'

var sendPathChanges = false

const { ipcRenderer } = window.require('electron')

@Component({
    components: {
        FolderView,
        Viewer
    }
})
export default class App extends Vue {
    folderLeftEventBus = new Vue()
    folderRightEventBus = new Vue()
    leftHasFocus = false
    showViewer = false
    showHidden = false
    selectedItem = ""
    basePath = ""
    dialogOpen = false
    keyDown$ = new Subject()
    
    mounted() {
		this.folderLeftEventBus.$emit("focus") 

        const tabs$ = this.keyDown$.pipe(filter((evt: any) => evt.event.which == 9 && !evt.event.shiftKey))
		this.$subscribeTo(tabs$, (evt: any) => {
			evt.event.stopPropagation()
			evt.event.preventDefault()
			this.getInactiveFolder().$emit("focus")
        })

        ipcRenderer.on("changeTheme", (event: any, theme: string) => this.changeTheme(theme))
        ipcRenderer.send('ready')

        // let index = 0
      	// this.ws.onmessage = m => {
		// 	let msg = JSON.parse(m.data) as CommanderMessage
		// 	switch (msg.method) {
		// 		case "wantPathChanges":
		// 			sendPathChanges = true
		// 			break
	    // }
    }

 	onLeftFocus() { 
 		this.leftHasFocus = true 
 		//this.selectedItem = this.$refs.leftFolder.getSelectedItem()
    }
     
 	onRightFocus() { 
 		this.leftHasFocus = false 
    }
     
	getActiveFolder() {
        return this.leftHasFocus ? this.folderLeftEventBus : this.folderRightEventBus
    }
    
    getInactiveFolder() {
        return this.leftHasFocus ? this.folderRightEventBus : this.folderLeftEventBus
	}

 	selectionChanged(index: number) {
	 		this.getActiveFolder().$emit("selectionChanged", index)
	}
    
    pathChanged(path: string, basePath: string) {
        // this.selectedItem = path
        // this.basePath = basePath
        // const msg: OutMsg = {
        //     case: OutMsgType.PathChanged,
        //     fields: [path]
        // }
        // if (sendPathChanges)
        //     this.ws.send(JSON.stringify(msg))
    }
    
	viewerHeightChanged() {
    	this.folderLeftEventBus.$emit("resize")
		this.folderRightEventBus.$emit("resize")
    }
    
    onDialogStateChanged(isShowing: boolean) { this.dialogOpen = isShowing }	
	// 	rename() { console.log("Rename", this)},
    //     extendedRename() { console.log("Extended Rename", this)},		
    openSameFolder() {
        this.getInactiveFolder().$emit("path", this.basePath)
    }
    
    changeTheme(theme: string) {
        const styleSheet = document.getElementById("theme")  
        if (styleSheet)
            styleSheet.remove()
        
        const head = document.getElementsByTagName('head')[0]
        let link = document.createElement('link')
        link.rel = 'stylesheet'
        link.id = 'theme'
        link.type = 'text/css'
        link.href = `assets/themes/${theme}.css`
        link.media = 'all'
        head.appendChild(link)
        this.folderLeftEventBus.$emit("themeChanged")
        this.folderRightEventBus.$emit("themeChanged")
    }
}
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

