import { createApp } from 'vue'

import '@unocss/reset/tailwind.css'
import 'uno.css'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/index.scss'
import './assets/css/main.scss'
import './permission'
import './assets/js/mainNotice/index'
import App from './App.vue'
import router from './router'
import { errorHandler } from './error'
import store from './store'
import './assets/js/global'
import './assets/js/rules.js'
import './assets/js/globalConfig'

import { i18n } from './i18n'
import './assets/js/globalSocket'
import './assets/css/elementPlus.scss'

import TitleBar from './components/common/TitleBar.vue'
import { initSocket } from './assets/js/ws'

const app = createApp(App)
app.use(ElementPlus, { i18n: i18n.global.t })
app.use(router)
app.use(store)
app.use(i18n)
errorHandler(app)

// 全局引入 TitleBar 组件
app.component('TitleBar', TitleBar)

app.mount('#app')

initSocket()
