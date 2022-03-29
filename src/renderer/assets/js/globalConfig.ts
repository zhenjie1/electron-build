const { ipcRenderer } = require('electron')
import { isDev } from '@renderer/utils/tools'
import { cloneDeep } from 'lodash'
import { reactive } from 'vue'

const globalConfig = reactive({
	debug: false, // isDev,
})

watch(
	() => globalConfig,
	(data) => {
		ipcRenderer.send('globalConfig', cloneDeep(data))
	},
	{
		deep: true,
		immediate: true,
	}
)

window.globalConfig = globalConfig
