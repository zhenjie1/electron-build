const { ipcRenderer } = require('electron')
import { acceptHMRUpdate, defineStore } from 'pinia'
import { cloneDeep } from 'lodash'

export const useUserStore = defineStore(
	'user',
	() => {
		/**
		 * 用户信息
		 */
		const info = ref<Data>({})

		/**
		 * token
		 */
		const token = ref('')

		/**
		 * 设置用户信息
		 */
		function setInfo(data: Data) {
			info.value = data
		}

		/**
		 * 设置token
		 */
		function setToken(newToken: string) {
			token.value = newToken
		}

		const setter = reactive({
			/**
			 * 用户浏览器安装位置
			 */
			chrome: '',
		})
		function setterChange(key: keyof typeof setter, data: any) {
			setter[key] = data
			ipcRenderer.send('setter', cloneDeep(setter))
		}

		return {
			info,
			token,
			setInfo,
			setToken,

			setter,
			setterChange,
		}
	},
	{
		persist: true,
	}
)

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
