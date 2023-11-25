import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCurrentTabStore = defineStore('currentTab', () => {
  const currentTab = ref("getStarted")
  const changeTab = (index: string) => {
    currentTab.value = index
  }

  return { currentTab, changeTab}
})
