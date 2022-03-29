import { sockets } from './ws'
import { get, cloneDeep } from 'lodash'
import api from '@renderer/api/index'

const { ipcRenderer } = require('electron')

/**
 * socket 的全局监听
 */
sockets.receive('zombie', (params: Data) => {
	ipcRenderer.send('socketEvent', params)
})

ipcRenderer.on('sendGoodData', (_, data: Data) => {
	sockets.send('zombie', data)
})

ipcRenderer.on('apiFetch', (_: any, data: Data) => {
	if (!data.path) throw new Error('缺少 data.path ')
	if (!data.params) data.params = []

	const fetch = get(api, data.path)

	if (fetch) {
		if (data.type === 'fetch') {
			fetch
				.apply(null, data.params)
				.then((result: any) => {
					ipcRenderer.send('apiFetchResult', {
						success: true,
						data: result,
						id: data.id,
					})
				})
				.catch((error) => {
					console.log('接口异常', error)
					ipcRenderer.send('apiFetchResult', {
						success: false,
						error: {
							status: error.status,
							ok: error.ok,
						},
						id: data.id,
					})
				})
		} else {
			const { success, fail } = fetch().start.apply(null, data.params)

			success((result: any) => {
				ipcRenderer.send('apiFetchResult', {
					success: true,
					data: cloneDeep(result),
					id: data.id,
				})
			})
			fail(() => {
				console.log('fail')
				ipcRenderer.send('apiFetchResult', { success: false, id: data.id })
			})
		}
	}
})
