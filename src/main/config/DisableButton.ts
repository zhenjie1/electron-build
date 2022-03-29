import { globalShortcut } from 'electron'
import config from '@config/index'
import { mainWindow } from '..'

export default {
	Disablef12() {
		// console.log('全局事件')
		// // if (process.env.NODE_ENV === 'production' && config.DisableF12) {
		// globalShortcut.register('CommandOrControl+X', () => {
		// 	console.log('用户试图启动控制台')
		// 	mainWindow.webContents.openDevTools()
		// })
		// // }
	},
}
