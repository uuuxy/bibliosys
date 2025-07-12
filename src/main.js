import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router' // Router importieren

import './style.css' // Ihr globales CSS
import App from './App.vue'

const app = createApp(App)

app.use(createPinia()) // Pinia initialisieren
app.use(router)      // Router initialisieren

app.mount('#app')