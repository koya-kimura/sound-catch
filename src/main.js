import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './firebase'
import { useAuth } from './composables/useAuth'

const app = createApp(App)

// 認証状態の初期化
const { initSession } = useAuth()
initSession()

app.use(router)
app.mount('#app')
