<script setup lang="ts">
import { ref,reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthRealStore } from '@/stores/auth-real'
import { loginSchema, type LoginInput } from '@/modules/auth/validation'
import type {ZodIssue} from 'zod'
const route = useRoute()
const router = useRouter()
const authStore = useAuthRealStore()
const showPassword = ref(false)
const form = reactive<LoginInput>({
  email: '',
  password: ''
})
const errors = ref<Record<string, string>>({})
async function handleLogin() {
  errors.value = {}
  const validation = loginSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((err: ZodIssue) => {
      if (err.path.length > 0) {
        errors.value[err.path[0]] = err.message
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

      <div v-if="authStore.error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
        <i class="pi pi-exclamation-circle text-base"></i>
        <span>{{ authStore.error }}</span>
      </div>

      <form @submit.prevent="handleLogin" novalidate class="space-y-5">
        
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
            Email Address
          </label>
          <div class="relative w-full">
            <input 
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            placeholder="enter your email"
            class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-red-700 transition-colors placeholder:text-zinc-300 text-zinc-800"
            :disabled="authStore.loading"
            />
            <i class="pi pi-envelope absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
          </div>
            <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs font-bold text-zinc-800 tracking-wider uppercase">
            Password
          </label>
          <div class="relative w-full">
              <input 
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="Enter your password"
              :class="{ 'border-red-500': errors.password }"
              class="w-full text-sm pl-4 pr-10 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-red-700 transition-colors placeholder:text-zinc-300 text-zinc-800"
              :disabled="authStore.loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm"></i>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
        </div>

        <button 
          type="submit" 
          class="w-full bg-[#990011] hover:bg-[#7a000d] text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-base mt-6"
          :disabled="authStore.loading"
        >
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