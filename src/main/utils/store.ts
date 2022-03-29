import Store from 'electron-store'
Store.initRenderer()
export const mainStore = new Store()

/**
 * 设置一个对象
 */
export function setStore(key: string, data: Data) {
	if (typeof data === 'object') {
		Object.keys(data).map((k) => {
			mainStore.set(`${key}.${k}`, data[k])
		})
	} else {
		mainStore.set(key, data)
	}
}
