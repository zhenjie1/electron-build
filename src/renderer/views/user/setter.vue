<template>
	<div class="setter p-4 w-[50%]">
		<el-form label-width="100px">
			<el-form-item label="chrome 地址">
				<div class="flex w-full">
					<el-input v-model="form.chrome" class="mr-3"></el-input>
					<el-button @click="chromeHandler">保存</el-button>
				</div>
				<p class="text-$gray whitespace-nowrap">如果可以正常使用，请勿修改</p>
			</el-form-item>
			<el-form-item label="版本更新">
				<div class="flex w-full">
					<el-button :loading="disabledCheck" @click="checkUpdate">检查更新</el-button>
					<p class="ml-3 whitespace-nowrap">当前版本 {{ form.version }}</p>
				</div>
			</el-form-item>
		</el-form>
	</div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@renderer/store'
import config from '../../../../package.json'
const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const store = new Store()
const electronStore = store.get('setter', {}) || {}

const userStore = useUserStore()
const disabledCheck = ref(false)
const form = reactive({
	chrome: '',
	version: config.version,
})

ipcRenderer.on('UpdateMsg', () => {
	setTimeout(() => {
		disabledCheck.value = false
	}, 1000)
})
if (typeof electronStore === 'object') {
	for (const i in electronStore) form[i] = electronStore[i]
}

const chromeHandler = () => {
	userStore.setterChange('chrome', form.chrome)
}

const checkUpdate = () => {
	disabledCheck.value = true
	ipcRenderer.invoke('check-update')
}

if (!window.globalConfig) window.globalConfig = {} as any
window.globalConfig.debug = false
</script>
