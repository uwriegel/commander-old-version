<template>
    <svg class="svg" viewBox="0 0 32 32">
        <circle v-bind:style="{ strokeDasharray: progress + ' 100' }"
            r="16" cx="16" cy="16" />
    </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProgressView extends Vue {
    @Prop({ type: Number, default: () => new Vue() })
    progress!: Number
}
</script>

<style scoped>
.svg {
    width: 16px;
    height: 16px;
    transform: rotate(-90deg);
    border-radius: 50%;
}
circle {
    fill: transparent;
    stroke: white;
    stroke-width: 32;
}
</style>