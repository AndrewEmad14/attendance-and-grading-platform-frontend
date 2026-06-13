<script setup lang="ts">
import { ref } from 'vue'

const studentId = ref('')
const ledger = ref([] as any)
const loading = ref(false)
const error = ref('')

async function loadLedger() {
  error.value = ''
  ledger.value = []
  if (!studentId.value) {
    error.value = 'Please provide a student id.'
    return
  }
  loading.value = true
  try {
    // Placeholder: replace with real API call
    await new Promise((r) => setTimeout(r, 500))
    ledger.value = [
      { date: '2026-06-01', activity: 'Opening balance', credit: 0, debit: 0, balance: 100 },
      { date: '2026-06-05', activity: 'Tuition', credit: 0, debit: 20, balance: 80 },
      { date: '2026-06-10', activity: 'Payment', credit: 50, debit: 0, balance: 130 },
    ] as any
  } catch {
    error.value = String('Failed to load ledger')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-student-ledger">
    <h1>Student Ledger (Admin View)</h1>

    <div class="controls">
      <label>
        Student ID:
        <input v-model="studentId" type="text" placeholder="Enter student id" />
      </label>
      <button @click="loadLedger">Load Ledger</button>
    </div>

    <section v-if="loading">Loading...</section>
    <section v-else>
      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="ledger && ledger.length">
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>Credit</th>
              <th>Debit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in ledger" :key="idx">
              <td>{{ row.date }}</td>
              <td>{{ row.activity }}</td>
              <td>{{ row.credit ?? '-' }}</td>
              <td>{{ row.debit ?? '-' }}</td>
              <td>{{ row.balance ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>No ledger entries. Enter a student id and click Load Ledger.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-student-ledger {
  padding: 16px;
  font-family: Arial, sans-serif;
}
.controls {
  margin-bottom: 12px;
}
.controls input {
  margin-left: 8px;
  padding: 4px;
}
.controls button {
  margin-left: 8px;
  padding: 6px 10px;
}
.ledger-table {
  width: 100%;
  border-collapse: collapse;
}
.ledger-table th,
.ledger-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.error {
  color: red;
  margin-bottom: 8px;
}
</style>
