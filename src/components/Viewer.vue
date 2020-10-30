<template>
    <div class="viewer">
        <img :src="itemPath" v-if="isImage(itemPath)">
        <video autoplay controls :src="itemPath" v-if="isVideo(itemPath)"></video>
        <iframe :src="itemPath" v-if="isPdf(itemPath)" frameBorder="0"></iframe>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    props: [
        "src"
    ],
    data() {
        return {
            itemPath: ""
        }
    },
    watch: {
        src() {
            this.itemPath = "http://localhost:9865/getfile?file=" + this.src
        }
    },
    mounted() { this.itemPath = this.src },    
    methods: {
        isImage(value: string) {
            return value.toLowerCase().endsWith('jpg') || value.toLowerCase().endsWith('png') || value.toLowerCase().endsWith('gif')
        },
        isVideo(value: string) {
            return value.toLowerCase().endsWith('mp4')
        }, 
        isPdf(value: string) {
            return value.toLowerCase().endsWith('pdf')
        }, 
    }    
})

</script>

<style scoped>
.viewer {
    position: relative;
}
img, video, iframe {
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
</style>