<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { forgotPasswordSchema } from '@/modules/auth/validation'
import type { ZodIssue } from 'zod'

const router = useRouter()
const authStore = useAuthStore()
const success = ref(false)

const form = reactive({
  email: ''
})
const errors = ref<Record<string, string>>({})

onMounted(() => {
  authStore.error = null
})

async function handleForgotPassword() {
  errors.value = {}
  authStore.error = null

  const validation = forgotPasswordSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err: ZodIssue) => {
      if (err.path.length > 0) {
        errors.value[String(err.path[0])] = err.message
      }
    })
    return
  }

  try {
    await authStore.forgotPassword(form.email)
    success.value = true
  } catch (err) {
    console.error('forgot password attempt rejection:', err)
  }
}

function goBackToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-zinc-50 p-4 font-sans">
    <div class="w-full max-w-md bg-white border border-zinc-200/80 rounded-lg p-8 shadow-xs">

      <div class="flex flex-col items-center text-center mb-8">
        <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-md mb-5">
          <img src="/public//logo.svg" alt="ITI logo" />
        </div>

        <h1 class="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
          ITI Portal
        </h1>
        <p class="text-xs text-zinc-500 mt-2 font-medium">
          Attendance & Grading Platform
        </p>
      </div>

      <!-- Success Screen -->
      <div v-if="success" class="text-center py-4">
        <div
          class="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success-border">
          <i class="pi pi-check text-success-content text-2xl"></i>
        </div>
        <h2 class="text-xl font-bold text-zinc-900 mb-2">Check your email</h2>
        <p class="text-sm text-zinc-600 mb-6 leading-relaxed">
          We've sent a password reset link to <span class="font-semibold text-zinc-800">{{ form.email }}</span>. Please
          check your inbox and spam folder.
        </p>
        <button @click="goBackToLogin"
          class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md transition-colors cursor-pointer text-base shadow-xs">
          Back to Login
        </button>
      </div>

      <!-- Form Screen -->
      <div v-else>
        <h2 class="text-lg font-bold text-zinc-900 mb-2 text-center">Forgot Password?</h2>
        <p class="text-xs text-zinc-500 mb-6 text-center leading-relaxed">
          Enter your registered email address below, and we'll send you instructions to reset your password.
        </p>

        <div v-if="authStore.error"
          class="mb-4 p-3 bg-danger border border-danger-border text-danger-content text-sm rounded-md flex items-center gap-2">
          <i class="pi pi-exclamation-circle text-base"></i>
          <span>{{ authStore.error }}</span>
        </div>

        <form @submit.prevent="handleForgotPassword" novalidate class="space-y-5">
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
              Email Address
            </label>
            <div class="relative w-full">
              <input id="email" v-model="form.email" type="email" required autocomplete="email"
                placeholder="Enter your email"
                class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-danger-border transition-colors placeholder:text-zinc-300 text-zinc-800"
                :class="{ 'border-danger-border': errors.email || authStore.error }" :disabled="authStore.loading" />
              <i class="pi pi-envelope absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
            </div>
            <p v-if="errors.email" class="text-xs text-danger-content mt-1">{{ errors.email }}</p>
          </div>

          <button type="submit"
            class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-base mt-6 shadow-xs"
            :disabled="authStore.loading">
            <template v-if="authStore.loading">
              <i class="pi pi-spin pi-spinner text-sm"></i>
              <span>Sending...</span>
            </template>
            <template v-else>
              <span>Send Reset Link</span>
              <i class="pi pi-send text-sm"></i>
            </template>
          </button>
        </form>

        <div class="text-center mt-6">
          <router-link to="/login"
            class="text-sm font-semibold text-[#990011] hover:text-[#7a000d] transition-colors inline-flex items-center gap-1">
            <i class="pi pi-arrow-left text-xs"></i>
            <span>Back to Login</span>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>