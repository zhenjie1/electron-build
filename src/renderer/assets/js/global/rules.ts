import api from '@renderer/api'
const { ipcRenderer } = require('electron')

api.rules.get().then((res) => {
	// console.log(res)
	ipcRenderer.send('setRules', res)
})
