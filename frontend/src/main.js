import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import des styles
import 'bootstrap-icons/font/bootstrap-icons.css'; // Ajout des icônes Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap'
import './assets/styles.css'; // Import du fichier CSS global

import { createPinia } from 'pinia'

const app = createApp(App)
app.config.globalProperties.$bootstrap = bootstrap
window.bootstrap = bootstrap
app.use(router)
app.use(createPinia())

app.mount('#app')