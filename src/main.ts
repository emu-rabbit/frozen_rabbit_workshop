import { createApp } from 'vue'
import './style.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import { i18n } from './i18n'

const app = createApp(App)

app.use(i18n)
app.use(PrimeVue, {
    theme: {
        preset: Aura, // We use Aura as a light base but will override colors with Tailwind classes later or use PrimeVue preset
        options: {
            darkModeSelector: false || 'none',
        }
    }
})

app.mount('#app')

// Handle Vite dynamic import errors (e.g. after a new deployment)
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error detected. Reloading page...');
    window.location.reload();
});
