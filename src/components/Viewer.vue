<template>
    <div class="viewer">
        <img :src="itemPath" v-if="isImage(itemPath)">
        <video autoplay controls :src="itemPath" v-if="isVideo(itemPath)"></video>
        <iframe :src="itemPath" v-if="isPdf(itemPath)" frameBorder="0"></iframe>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Viewer extends Vue {
    @Prop()
    src!: string
    
    @Watch("src")
    onPropertyChanged() {
        this.itemPath = "preview:///?file=" + this.src
    }

    itemPath = ""
    mounted() { this.itemPath = this.src }

    isImage(value: string) {
        return value.toLowerCase().endsWith('jpg') || value.toLowerCase().endsWith('png') || value.toLowerCase().endsWith('gif')
    }

    isVideo(value: string) {
        return value.toLowerCase().endsWith('mp4') || value.toLowerCase().endsWith('mkv')
    } 
    
    isPdf(value: string) {
        return value.toLowerCase().endsWith('pdf')
    } 
}

</script>

<style scoped>
.viewer {
    position: relative;
}
img, iframe {
    position: absolute;
    display: block;
    max-width: 100%;
    height: auto;
    max-height: 100%;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;    
}
video {
    position: absolute;
    outline-width: 0px;
    background-color: black;
    width: 100%;
    height: 100%;
}
</style>