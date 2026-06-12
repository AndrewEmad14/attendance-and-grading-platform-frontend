import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// PrimeVue Core Configuration
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// Global CSS
import '@/assets/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '[data-theme="dark"]', // Aligns theme toggles with DaisyUI/Tailwind dark modes
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue, daisyui, utilities',
      },
    },
  },
})

app.use(createPinia())
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)

app.config.errorHandler = (err, instance, info) => {
  console.error('------- GLOBAL APPLICATION EXCEPTION CRITICAL BOUNDARY -------')
  console.error('Error Object:', err)
  console.error('Component Context:', instance)
  console.error('Vue Lifecycle Info Tracker:', info)

  // we can hook up an external tracking tool (Sentry, LogRocket, etc.) down the road
}

app.mount('#app')
