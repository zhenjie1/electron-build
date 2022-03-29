const { ipcRenderer } = require('electron')
import { useSwitchStore } from '@renderer/store'
import { ElMessage } from 'element-plus'

/**
 * 向页面展示消息
 */
ipcRenderer.on('message', (_: any, data: Data) => {
	const { msg, status = 'error', type } = data
	if (msg) ElMessage[status](msg)

	if (type === 'localIpDisabled') {
		const switchStore = useSwitchStore()
		switchStore.data.ipDisabled = true
	}
})
