<script setup lang="ts">
import { ref } from 'vue'

const scanActive = ref(false)

function startScan() {
  scanActive.value = true
}

function stopScan() {
  scanActive.value = false
}
</script>

<style scoped>
.attendance-scan-page {
  padding: 24px;
}

button {
  margin-right: 8px;
}
</style>
<template>
  <div class="attendance-scan-page">
    <h1>Attendance Scan</h1>
    <p>Scan student QR codes or badges to record attendance.</p>
    <button @click="startScan" type="button">Start Scan</button>
    <button @click="stopScan" type="button">Stop Scan</button>
    <p v-if="scanActive">Scanner is active.</p>
  </div>
</template>
