import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
export * from './modules/user'
export * from './modules/switch'

const store = createPinia()
store.use(piniaPluginPersistedstate)

export default store
