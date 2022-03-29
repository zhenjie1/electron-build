import { sockets } from '../ws'

const { ipcRenderer } = require('electron')

ipcRenderer.on('task:log', (_, data) => {
	const { info = {}, log = '', url, status } = data

	sockets.send('zombie', {
		type: 'task:log',
		params: {
			source_url: url,
			zombie_task_id: info.id,
			note: log,
			status,
		},
	})
})
