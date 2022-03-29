import { socketObj } from '@renderer/assets/js/ws'
import { useUserStore } from '@renderer/store'

/**
 * 将字符串转为对象
 * @param {any} data data
 * @returns {object}
 */
export const strToJson = (data: any): any => {
	try {
		return JSON.parse(data)
	} catch {
		return data
	}
}

/**
 * 清空用户相关数据
 */
export const clearUserData = () => {
	console.trace('清空用户数据')
	const store = useUserStore()
	store.setInfo({})
	// store.setToken('')
	socketObj.close()
}

/**
 * 创建一个空 promise
 */
export const createPromise = <T = any>() => {
	let resolve
	let reject
	const p = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { resolve, reject, p }
}
