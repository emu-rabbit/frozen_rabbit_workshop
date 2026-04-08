import { createApp } from 'vue'
import './style.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'

const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura, // We use Aura as a light base but will override colors with Tailwind classes later or use PrimeVue preset
        options: {
            darkModeSelector: false || 'none',
        }
    }
})

app.mount('#app')
