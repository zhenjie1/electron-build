<template>
	<div id="wrapper">
		<el-dialog
			v-model="dialogVisible"
			title="升级中"
			width="360px"
			top="35vh"
			:close-on-press-escape="false"
			:close-on-click-modal="false"
			:show-close="false"
		>
			<div class="conten">
				<el-progress
					type="dashboard"
					:percentage="percentage"
					:color="colors"
					:status="progressStaus"
				></el-progress>
			</div>
		</el-dialog>
		<update-progress v-model="showForcedUpdate" />
	</div>
</template>

<script setup lang="ts">
import UpdateProgress from './updataProgress/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onUnmounted, Ref, ref } from 'vue'

const { ipcRenderer, shell } = require('electron')

const percentage = ref(0)
const colors: Ref<ColorInfo[]> = ref([
	{ color: '#f56c6c', percentage: 20 },
	{ color: '#e6a23c', percentage: 40 },
	{ color: '#6f7ad3', percentage: 60 },
	{ color: '#1989fa', percentage: 80 },
	{ color: '#5cb87a', percentage: 100 },
])

const dialogVisible = ref(false)
let progressStaus = ref(null)
const showForcedUpdate = ref(false)
const filePath = ref('')

ipcRenderer.on('download-progress', (event, arg) => {
	percentage.value = Number(arg)
})
ipcRenderer.on('download-error', (event, arg) => {
	if (arg) {
		progressStaus = 'exception'
		percentage.value = 40
	}
})
ipcRenderer.on('download-paused', (event, arg) => {
	if (arg) {
		progressStaus = 'warning'
		ElMessageBox.alert('下载由于未知原因被中断！', '提示', {
			confirmButtonText: '重试',
			callback: (action) => {
				ipcRenderer.invoke('start-download')
			},
		})
	}
})
ipcRenderer.on('download-done', (event, age) => {
	filePath.value = age.filePath
	progressStaus = 'success'
	ElMessageBox.alert('更新下载完成！', '提示', {
		confirmButtonText: '确定',
		callback: (action) => {
			shell.openPath(filePath.value)
		},
	})
})
// electron-updater的更新监听
ipcRenderer.on('UpdateMsg', (event, age) => {
	const callback = {
		'-1'() {
			const msgdata = {
				title: '发生错误',
				message: age.msg,
			}
			dialogVisible.value = false
			ElMessage.error(msgdata.title)
		},
		0() {
			ElMessage('正在检查更新')
		},
		1() {
			ElMessage({
				type: 'success',
				message: '已检查到新版本，开始下载',
			})
			dialogVisible.value = true
		},
		2() {
			ElMessage({ type: 'success', message: '无新版本' })
		},
		3() {
			percentage.value = age.msg.percent.toFixed(1)
		},
		4() {
			progressStaus = 'success'
			ElMessageBox.alert('更新下载完成！', '提示', {
				confirmButtonText: '确定',
				callback: (action) => {
					ipcRenderer.invoke('confirm-update')
				},
			})
		},
	}
	callback[age.state]?.()
})
ipcRenderer.on('hot-update-status', (event, msg) => {
	const callback = {
		downloading() {
			ElMessage('正在下载')
		},
		moving() {
			ElMessage('正在移动文件')
		},
		finished() {
			ElMessage.success('成功,请重启')
		},
		failed() {
			ElMessage.error(msg.message.message)
		},
	}
	callback[msg.status]?.()
	console.log(msg)
})
onUnmounted(() => {
	ipcRenderer.removeAllListeners('confirm-message')
	ipcRenderer.removeAllListeners('download-done')
	ipcRenderer.removeAllListeners('download-paused')
	ipcRenderer.removeAllListeners('confirm-stop')
	ipcRenderer.removeAllListeners('confirm-start')
	ipcRenderer.removeAllListeners('confirm-download')
	ipcRenderer.removeAllListeners('download-progress')
	ipcRenderer.removeAllListeners('download-error')
})
</script>

<style lang="scss" scoped>
* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	font-family: 'Source Sans Pro', sans-serif;
}

#logo {
	height: auto;
	margin-bottom: 20px;
	width: 420px;
}

main {
	display: flex;
	justify-content: space-between;
}

main > div {
	flex-basis: 50%;
}

.left-side {
	display: flex;
	flex-direction: column;
}

.welcome {
	color: #555;
	font-size: 23px;
	margin-bottom: 10px;
}

.title {
	color: #2c3e50;
	font-size: 20px;
	font-weight: bold;
	margin-bottom: 6px;
}

.title.alt {
	font-size: 18px;
	margin-bottom: 10px;
}
.doc {
	margin-bottom: 10px;
}
.doc p {
	color: black;
	margin-bottom: 10px;
}
.doc .el-button {
	margin-top: 10px;
	margin-right: 10px;
}
.doc .el-button + .el-button {
	margin-left: 0;
}
.conten {
	text-align: center;
}
</style>
