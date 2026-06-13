<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resetPasswordSchema } from '@/modules/auth/validation'
import type { ZodIssue } from 'zod'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const success = ref(false)

const form = reactive({
  token: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const errors = ref<Record<string, string>>({})

onMounted(() => {
  authStore.error = null
  // Pre-fill fields from URL query parameters if present
  if (route.query.token) {
    form.token = String(route.query.token)
  }
  if (route.query.email) {
    form.email = String(route.query.email)
  }
})

async function handleResetPassword() {
  errors.value = {}
  authStore.error = null
  
  const validation = resetPasswordSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err: ZodIssue) => {
      if (err.path.length > 0) {
        errors.value[String(err.path[0])] = err.message
      }
    })
    return
  }

  try {
    await authStore.resetPassword(validation.data)
    success.value = true
  } catch (err) {
    console.error('reset password attempt rejection:', err)
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
        <div class="w-16 h-16 bg-[#111827] rounded-lg flex items-center justify-center shadow-md mb-5">
          <svg class="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#E5E7EB" opacity="0.15"/>
            <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#DC2626"/>
            <path d="M3 7V17L12 22V12L3 7Z" fill="#B91C1C"/>
            <path d="M21 7V17L12 22V12L21 7Z" fill="#991B1B"/>
            <path d="M9 10V15L12 16.5L15 15V10L12 11.5L9 10Z" fill="white"/>
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
          Cohort Hub
        </h1>
        <p class="text-xs text-zinc-500 mt-2 font-medium">
          Attendance & Grading Platform 
        </p>
      </div>

      <!-- Success Screen -->
      <div v-if="success" class="text-center py-4">
        <div class="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success-border">
          <i class="pi pi-check text-success-content text-2xl"></i>
        </div>
        <h2 class="text-xl font-bold text-zinc-900 mb-2">Password Reset Success</h2>
        <p class="text-sm text-zinc-600 mb-6 leading-relaxed">
          Your password has been successfully updated. You can now use your new password to sign in.
        </p>
        <button 
          @click="goBackToLogin" 
          class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md transition-colors cursor-pointer text-base shadow-xs"
        >
          Go to Login
        </button>
      </div>

      <!-- Form Screen -->
      <div v-else>
        <h2 class="text-lg font-bold text-zinc-900 mb-2 text-center">Reset Password</h2>
        <p class="text-xs text-zinc-500 mb-6 text-center leading-relaxed">
          Please enter your new password to update your credentials.
        </p>

        <div v-if="!form.token || !form.email" class="mb-4 p-3 bg-warning border border-warning-border text-warning-content text-sm rounded-md flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-base"></i>
          <span>Invalid or missing reset token/email. Please request a new password reset link.</span>
        </div>

        <div v-if="authStore.error" class="mb-4 p-3 bg-danger border border-danger-border text-danger-content text-sm rounded-md flex items-center gap-2">
          <i class="pi pi-exclamation-circle text-base"></i>
          <span>{{ authStore.error }}</span>
        </div>

        <form @submit.prevent="handleResetPassword" novalidate class="space-y-5">
          <!-- New Password Input -->
          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
              New Password
            </label>
            <div class="relative w-full">
              <input 
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Enter new password"
                class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-danger-border transition-colors placeholder:text-zinc-300 text-zinc-800"
                :class="{ 'border-danger-border': errors.password }"
                :disabled="authStore.loading || !form.token || !form.email"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :disabled="!form.token || !form.email"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-danger-content mt-1">{{ errors.password }}</p>
          </div>

          <!-- Confirm Password Input -->
          <div class="flex flex-col gap-1.5">
            <label for="password_confirmation" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
              Confirm New Password
            </label>
            <div class="relative w-full">
              <input 
                id="password_confirmation"
                v-model="form.password_confirmation"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Confirm new password"
                class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-danger-border transition-colors placeholder:text-zinc-300 text-zinc-800"
                :class="{ 'border-danger-border': errors.password_confirmation }"
                :disabled="authStore.loading || !form.token || !form.email"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                :disabled="!form.token || !form.email"
              >
                <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
              </button>
            </div>
            <p v-if="errors.password_confirmation" class="text-xs text-danger-content mt-1">{{ errors.password_confirmation }}</p>
          </div>

          <button 
            type="submit" 
            class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-base mt-6 shadow-xs"
            :disabled="authStore.loading || !form.token || !form.email"
          >
            <template v-if="authStore.loading">
              <i class="pi pi-spin pi-spinner text-sm"></i>
              <span>Resetting...</span>
            </template>
            <template v-else>
              <span>Reset Password</span>
              <i class="pi pi-check text-sm"></i>
            </template>
          </button>
        </form>

        <div class="text-center mt-6">
          <router-link to="/login" class="text-sm font-semibold text-[#990011] hover:text-[#7a000d] transition-colors inline-flex items-center gap-1">
            <i class="pi pi-arrow-left text-xs"></i>
            <span>Back to Login</span>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>