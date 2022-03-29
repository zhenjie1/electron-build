import { acceptHMRUpdate, defineStore } from 'pinia'

export const useSwitchStore = defineStore(
	'switch',
	() => {
		/**
		 * 用户信息
		 */
		const data = reactive({
			ipDisabled: false,
		})

		/**
		 * 设置用户信息
		 */
		function change(key: keyof typeof data, val: any) {
			data[key] = val
		}

		return {
			data,
			change,
		}
	},
	{
		persist: true,
	}
)

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSwitchStore, import.meta.hot))
