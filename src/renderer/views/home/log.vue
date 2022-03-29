<script lang="ts" setup>
import api from '@renderer/api'
import { PropType } from 'vue'
import { copy } from '@renderer/utils/tools'
import { ElMessage } from 'element-plus'
const { ipcRenderer } = require('electron')

defineEmits(['close'])
const props = defineProps({
	task: {
		type: Object as PropType<any>,
		default: () => ({}),
	},
})

const title = computed(() => {
	return `任务日志：${props.task.id || ''}`
})
const logs = reactive<Data[]>([])
const logAdd = (content: Data) => logs.unshift(onlyLogDealWith(content))

function onlyLogDealWith(item: Data) {
	item.log = item.log.replace(/(.*)(\[.+\])(.*)/, (args, $1, $2, $3) => {
		return $1 + $2.padEnd(12) + $3
	})
	// 提取 asin （中括号中的内容）添加一个 html 包裹，方便添加样式
	item.log = item.log.replace(/(.+)(\[.+\])(.+)/, '$1<span class="spanAsin">$2</span>$3')
	return item
}

const show = ref(true)

function receiveHandler(_, data) {
	const { info = {}, log = '', url, status } = data
	console.log(data, info.id, props.task.id, info.id !== props.task.id)
	if (info.id !== props.task.id) return

	logAdd({ url, log, status })
}
ipcRenderer.on('task:log', receiveHandler)

onUnmounted(() => {
	ipcRenderer.off('task:log', receiveHandler)
})

const { success, loading } = api.log.list().start({
	zombie_task_id: props.task.id,
	limit: 10000,
})
success((data: Data[]) => {
	logs.length = 0
	data = data.map((v) => ({
		url: v.source_url,
		log: v.note,
		status: v.status,
	}))
	data.map((v) => onlyLogDealWith(v))
	logs.push(...data)
})

const logBoxHandler = (e, item: Data) => {
	const target: HTMLElement = e.target

	if (target.classList.contains('spanAsin') && item.url) {
		copy(item.url)
		ElMessage.success('复制链接成功')
	}
}
</script>

<template>
	<el-dialog v-model="show" :title="title" width="630px" @close="$emit('close')">
		<div v-loading="loading" class="contentLog max-h-[60vh] min-h-50 overflow-y-auto">
			<pre
				v-for="(item, index) in logs"
				:key="index"
				:class="{ red: item.status === 'error' }"
				class="itemLog"
				:data-url="item.url"
				@click="logBoxHandler($event, item)"
				v-html="item.log"
			></pre>
		</div>
	</el-dialog>
</template>

<style scoped lang="scss">
::v-deep(.itemLog .spanAsin) {
	color: var(--main);
	cursor: pointer;
}
</style>
