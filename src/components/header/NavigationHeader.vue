<script setup lang="ts">
import ChangeTabButton from '@/components/header/ChangeTabButton.vue'
const tabs = [{
    index: "aboutUs",
    icon: "grass",
    label: "About Us"
}, {
    index: "getStarted",
    icon: "palette",
    label: "Get Started"
}]
</script>

<template>
    <div class="navigation-header surface">
        <div class="title-container">
            <button class="icon-button material-icons-outlined on-surface-text">map</button>
            <span class="title on-surface-text title-medium">Path Planning Web</span>
        </div>
        <div class="tabs-container">
            <ChangeTabButton v-for="tab in tabs" :index="tab.index" :icon="tab.icon" :label="tab.label">
            </ChangeTabButton>
        </div>
        <div class="other-operators-container">
            <button class="icon-button material-icons-outlined on-surface-text">info</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@/assets/SCSS/layout';

.navigation-header {
    height: 64px;
    border-bottom: 1px solid var(--md-sys-color-outline);
    @include layout.flex-portrait-center();
    justify-content: space-between;
}

.title-container {
    margin-left: 30px;
    @include layout.flex-portrait-center();
}

.title-container :not(:last-child) {
    margin-right: 15px;
}

.icon-button {
    cursor: pointer;
    transition: all 0.4s ease-in-out;
    height: 44px;
    width: 44px;
    border-radius: 50%;
    border: 0;
    background-color: var(--md-sys-color-surface);
    @include layout.flex-center();
}

.icon-button:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.title {
    font-family: 'Roboto';
    font-weight: bold;
}

.tabs-container {
    @include layout.flex-portrait-center();
}

.tabs-container :not(:last-child) {
    margin-right: 10px;
}

.other-operators-container {
    margin-right: 30px;
    @include layout.flex-portrait-center();
}

.other-operators-container :not(:last-child) {
    margin-right: 15px;
}

@media screen and (max-width: 600px){
    .title{
        display: none;
    }
    .title-container{
        margin-left: 10px;
    }
    .other-operators-container{
        margin-right: 10px;
    }
}
</style>