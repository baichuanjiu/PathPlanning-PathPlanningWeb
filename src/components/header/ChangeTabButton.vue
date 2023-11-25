<script setup lang="ts">
import { useCurrentTabStore } from '@/stores/current_tab'
import router from '@/router';
import ButtonWithPrefixIcon from '../buttons/ButtonWithPrefixIcon.vue';
const props = defineProps<{
    index: string,
    icon: string,
    label: string,
}>()
const currentTabStore = useCurrentTabStore()
const changeTab = () => {
    router.push({ path: '/' + props.index })
    currentTabStore.changeTab(props.index);
}
</script>

<template>
    <ButtonWithPrefixIcon :icon="icon" :label="label" type="text" :isSelected="true" v-if="index === currentTabStore.currentTab"></ButtonWithPrefixIcon>
    <ButtonWithPrefixIcon :icon="icon" :label="label" type="text" v-else @click=changeTab></ButtonWithPrefixIcon>
</template>