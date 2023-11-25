import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from "axios";

import App from './PathPlanningWeb.vue'
import router from './router'

axios.defaults.baseURL = 'https://localhost:5001'

const PathPlanningWeb = createApp(App)

PathPlanningWeb.use(createPinia())
PathPlanningWeb.use(router)

PathPlanningWeb.mount('#pathPlanningWeb')
