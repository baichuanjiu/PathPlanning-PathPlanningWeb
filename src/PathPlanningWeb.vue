<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import NavigationHeader from "@/components/header/NavigationHeader.vue";
</script>

<template>
  <NavigationHeader></NavigationHeader>
  <RouterView></RouterView>
</template>