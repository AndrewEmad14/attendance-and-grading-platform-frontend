<script setup lang="ts">
import { RouterView } from 'vue-router'
import MockIdentitySwitchWidget from './components/MockIdentitySwitchWidget.vue'
import { Toast } from 'primevue'
</script>

<template>
  <RouterView />
  <Toast />
  <MockIdentitySwitchWidget />
</template>

<style scoped></style>
