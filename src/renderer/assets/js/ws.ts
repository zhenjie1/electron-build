import { watch } from 'vue'
import { useUserStore } from '@store/index'
import { useWebSocket, WebSocketResult, tryOnUnmounted } from '@vueuse/core'
import { ajaxUrl } from '@renderer/api/fetch'
import { strToJson } from './tools'

type ReceiveData = {
	cb: Function
}

export let socketObj: WebSocketResult<Data>

/**
 * 对数据监听的回调
 */
const socketWatch = new Map<string, ReceiveData[]>()

/**
 * socket 上的一些方法
 */
export const sockets = {
	send(event: string, data: Data) {
		data.event = event
		socketObj.send(JSON.stringify(data))
	},
	receive(key: string, cb: Function, options: Data = {}) {
		const data = { ...options, cb }
		const oldData = socketWatch.get(key)
		if (oldData) {
			oldData.push(data)
			socketWatch.set(key, oldData)
		} else {
			socketWatch.set(key, [{ ...options, cb }])
		}

		tryOnUnmounted(() => {
			const saveData = socketWatch.get(key) as ReceiveData[]
			const newData = saveData?.filter((v) => v.cb !== cb)
			socketWatch.set(key, newData)
		})
	},
}

/**
 * 创建一个 socket
 */
export function createSocket() {
	const userStore = useUserStore()

	socketObj = useWebSocket(`wss://${ajaxUrl.host}/ws`, {
		autoReconnect: {
			retries: Infinity,
			delay: 1000,
		},
		heartbeat: {
			message: 'keep connect!',
			interval: 10 * 1000,
		},
	})

	const { data } = socketObj

	// 对数据进行监听（收消息）
	watch(data, (data) => {
		data = strToJson(data)
		if (!data) return

		const callbackPool = socketWatch.get(data.event)
		if (!callbackPool) return

		callbackPool.map((options) => {
			options.cb(data)
		})
	})

	// 登录
	sockets.send('login', {
		params: userStore.info.api_token,
		device: 'desktop',
	})

	return socketObj
}

/**
 * 初始化 socket
 */
export function initSocket() {
	// 连接中和已连接，关闭之前的连接
	if (socketObj && ['OPEN', 'CONNECTING'].includes(socketObj.status.value)) socketObj.close()

	// 重新创建连接
	socketObj = createSocket()
}
