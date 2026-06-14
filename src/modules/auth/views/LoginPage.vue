<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loginSchema, type LoginInput } from '@/modules/auth/validation'
import type { ZodIssue } from 'zod'
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showPassword = ref(false)
const form = reactive<LoginInput>({
  email: '',
  password: '',
})
const errors = ref<Record<string, string>>({})
async function handleLogin() {
  errors.value = {}
  const validation = loginSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err: ZodIssue) => {
      if (err.path.length > 0) {
        errors.value[String(err.path[0])] = err.message
      }
    })
    return
  }
  try {
    await authStore.login(validation.data)

    // Evaluate downstream pathing targets post-auth complete
    const fallbackRedirect = (route.query.redirect as string) || '/'
    await router.replace(fallbackRedirect)
  } catch (err) {
    // Pipeline error logging handled natively within Pinia Store definition context
    console.error('login attempt rejection:', err)
  }
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

        <p class="text-xs text-zinc-500 mt-2 font-medium">Attendance & Grading Platform</p>
      </div>

      <div v-if="authStore.error"
        class="mb-4 p-3 bg-danger border border-danger-border text-danger-content text-sm rounded-md flex items-center gap-2">
        <i class="pi pi-exclamation-circle text-base"></i>
        <span>{{ authStore.error }}</span>
      </div>

      <form @submit.prevent="handleLogin" novalidate class="space-y-5">
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
            Email Address
          </label>
          <div class="relative w-full">
            <input id="email" v-model="form.email" type="email" required autocomplete="email"
              placeholder="Enter your email"
              class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-danger-border transition-colors placeholder:text-zinc-300 text-zinc-800"
              :disabled="authStore.loading" />
            <i class="pi pi-envelope absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
          </div>
          <p v-if="errors.email" class="text-xs text-danger-content mt-1">{{ errors.email }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between items-center">
            <label for="password" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
              Password
            </label>
            <router-link to="/forgot-password"
              class="text-xs font-semibold text-[#990011] hover:text-[#7a000d] transition-colors">
              Forgot password?
            </router-link>
          </div>
          <div class="relative w-full">
            <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" required
              autocomplete="current-password" placeholder="Enter your password"
              :class="{ 'border-danger-border': errors.password }"
              class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-danger-border transition-colors placeholder:text-zinc-300 text-zinc-800"
              :disabled="authStore.loading" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              :aria-label="showPassword ? 'Hide password' : 'Show password'">
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
            </button>
          </div>
          <p v-if="errors.password" class="text-xs text-danger-content mt-1">{{ errors.password }}</p>
        </div>

        <button type="submit"
          class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-base mt-6"
          :disabled="authStore.loading">
          <template v-if="authStore.loading">
            <i class="pi pi-spin pi-spinner text-sm"></i>
            <span>Signing In...</span>
          </template>
          <template v-else>
            <span>Sign In</span>
            <i class="pi pi-sign-in text-sm transform flip-x"></i>
          </template>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Flip login icon orientation slightly to match standard graphic presentation standards */
.flip-x {
  transform: scaleX(1);
}
</style>
