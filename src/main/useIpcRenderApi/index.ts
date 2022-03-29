import { ipcMain } from 'electron'
import { mainWindow } from '../index'

/**
 * @type {Map<number, {object}>}
 */
const event = new Map()

export function useIpcRenderApi<T = any>(path: string, options = {}): Promise<T> {
	const id = Math.random()
	if (mainWindow) mainWindow.webContents.send('apiFetch', { ...options, path, id })

	// 超时处理
	setTimeout(() => run({ id, msg: '超时', options }), 20 * 1000)
	return new Promise((resolve, reject) => {
		event.set(id, { resolve, reject })
	})
}

ipcMain.on('apiFetchResult', (_, data) => {
	run(data)
})

function run(data = {} as Data) {
	const { id, success, error } = data
	if (error) {
		console.log('useIpcRenderApi Error ->', error)
	}
	if (!id) return

	const call = event.get(id)
	if (!call) return

	if (success) call.resolve(data.data)
	else call.reject(error)
}
