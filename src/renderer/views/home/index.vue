<template>
	<div class="containerBox px-3 h-full w-full">
		<!-- <landing-page></landing-page> -->
		<Log v-if="show.log" :task="checkTask" @close="show.log = false"></Log>
		<TaskCreate
			v-if="show.create"
			:country="countrySite"
			@close="show.create = false"
			@refresh="createTaskRefresh"
		></TaskCreate>
		<TaskEdit
			v-if="show.edit"
			:country="countrySite"
			:task="checkTask"
			@close="show.edit = false"
			@refresh="editTaskRefresh"
		></TaskEdit>

		<PageTemplate v-model:options="tableOptions" :await-fetch="api.home.list">
			<template #filter>
				<div class="topOperating pt-3">
					<el-button type="primary" @click="show.create = true">
						<el-icon class="mr-2"><plus /></el-icon>
						添加任务
					</el-button>
					<el-button :loading="tableOptions.loading" @click="tableOptions.refresh">
						刷新
					</el-button>
				</div>
			</template>
			<template #table>
				<el-table-column label="任务ID" align="left" prop="id" min-width="80" />
				<el-table-column label="国家" min-width="80">
					<template #default="{ row }">
						<span>{{ row.market_site.country }}</span>
					</template>
				</el-table-column>
				<el-table-column label="采集类型" prop="ui_mold" show-overflow-tooltip />
				<el-table-column label="关键词/类目/店铺" width="140" show-overflow-tooltip>
					<template #default="{ row }">{{ row.keyword || row.showUrl }}</template>
				</el-table-column>
				<el-table-column label="库存类型" align="left">
					<template #default="{ row }">
						<div v-if="row.mold != 3">
							{{ row.type == 'all' ? '所有' : '无库存' }}
						</div>
					</template>
				</el-table-column>
				<el-table-column label="Reviews" align="left" min-width="100px">
					<template #default="{ row }">
						<div v-if="row.mold != 3 && row.filters?.reviews?.length > 0">
							{{ row.filters.reviews[0] }} -
							{{ row.filters.reviews[1] }}
						</div>
					</template>
				</el-table-column>
				<el-table-column label="价格区间" align="left">
					<template #default="{ row }">
						<div v-if="row.mold != 3 && row.filters?.prices?.length > 0">
							{{ row.filters.prices[0] }} -
							{{ row.filters.prices[1] }}
						</div>
					</template>
				</el-table-column>
				<el-table-column
					label="修改时间"
					align="left"
					prop="updated_at"
					min-width="165px"
				/>
				<el-table-column label="页数" align="left">
					<template #default="{ row }">
						<span class="whitespace-nowrap">{{ collectPage(row) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="进度" align="center" width="130px">
					<template #default="{ row }">
						<span class="whitespace-nowrap">{{ progress(row) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="采集状态">
					<template #default="{ row }">
						<span :class="statusText(row.status).color">
							{{ statusText(row.status).text }}
						</span>
					</template>
				</el-table-column>
				<el-table-column fixed="right" label="操作" align="left" width="180px">
					<template #default="{ row }">
						<div class="whitespace-nowrap">
							<span class="text-$main cursor-pointer" @click="editHandler(row)">
								编辑
							</span>
							<span
								class="text-$main cursor-pointer mx-2"
								@click="removeHandler(row)"
							>
								删除
							</span>
							<span class="text-$main cursor-pointer" @click="logHandler(row)">
								日志
							</span>
							<el-switch
								v-model="row.switch"
								class="ml-2"
								@change="changeStatus(row, $event)"
							></el-switch>
						</div>
					</template>
				</el-table-column>
			</template>
		</PageTemplate>
	</div>
</template>

<script lang="ts" setup>
import { Plus } from '@element-plus/icons-vue'
import TaskCreate from './create.vue'
import TaskEdit from './editTask.vue'
import { computed } from 'vue'
import api from '@renderer/api/index'
import { debounce, cloneDeep } from 'lodash'
import { useUserStore } from '@renderer/store'
import { sockets } from '@renderer/assets/js/ws'
import Log from './log.vue'
import { TableOptions } from '@renderer/components/PageTemplate/pageTable'

const { ipcRenderer } = require('electron')
const userStore = useUserStore()

const show = reactive({
	log: false,
	create: false,
	edit: false,
})
const tableOptions = ref<TableOptions>({} as any)
const countrySite = computed(() => {
	return tableOptions.value.response?.data.data.sites
})

watch(
	() => tableOptions.value.list,
	() => {
		tableOptions.value.list?.map((v) => {
			v.switch = ['working', 'pending'].includes(v.status)
		})
	},
	{ immediate: true }
)
const editTaskRefresh = () => {
	show.edit = false
	tableOptions.value.refresh()
}
const createTaskRefresh = () => {
	show.create = false
	tableOptions.value.refresh()
}
const checkTask = ref<Data>(undefined)
const editHandler = (row) => {
	checkTask.value = row
	show.edit = true
}
const removeHandler = debounce(async (row: Data) => {
	await api.home.removeTask().start({ id: row.id })
	tableOptions.value.refresh()
}, 300)
const logHandler = (row) => {
	checkTask.value = row
	show.log = true
}

const statusText = (status) => {
	const data = {
		nothing: { text: '未开始', color: 'gray' },
		working: { text: '采集中', color: 'main' },
		paused: { text: '已暂停', color: 'yellow' },
		pending: { text: '排队中', color: 'blue' },
		finish: { text: '已完成', color: 'green' },
		suspended: { text: '已暂停', color: 'warning' },
	}
	return data[status] || { text: status }
}

ipcRenderer.on('pageProgress', (e, params) => {
	const { info, curIndex, total, asins = [] } = params
	console.log('page progress', asins.length, 'index:', curIndex)
	if (!tableOptions.value.list.length) tableOptions.value.refresh()
	const task = tableOptions.value.list.find((v) => v.id === info.id)
	if (!task) return

	task.pages = { curIndex, total }
})

const collectPage = (row: Data) => {
	const { status, filters, pages, mold, asins_array } = row
	if (mold === 3) {
		return asins_array.length + '条'
	}
	if (status === 'working') {
		return pages ? `${pages.curIndex} / ${pages.total}` : filters.pages[1]
	} else if (status === 'finish') {
		return `${filters.pages[1]} / ${filters.pages[1]}`
	} else {
		return filters.pages[1]
	}
}

const { success: taskWorking, data: workingTaskList } = api.home.list().start({
	status: ['working', 'pending'],
	page: 1,
	limit: 20,
})
taskWorking((data) => {
	// console.log(data.data)
	ipcRenderer.send('initTasks', {
		tasks: cloneDeep(data.data),
		processNumber: userStore.info.settings.collect_process_number,
	})
})

const progress = (row: Data) => {
	if (row.status === 'working') {
		return `${row.currentCount || 0} / ${row.totalCount || 0}`
	}
	return 0
}
ipcRenderer.on('progress', (_: any, data: Data) => {
	const { currentCount, info, total } = data

	if (!tableOptions.value.list.length) tableOptions.value.refresh()
	const task = tableOptions.value.list.find((v) => v.id === info.id)
	if (!task) return

	task.currentCount = currentCount
	task.totalCount = total
	console.log(data)
})

const changeStatus = debounce(async (row: Data, isOpen: any) => {
	let status = ''

	if (isOpen) {
		status = 'working'
		checkTask.value = row
		workingTaskList.value.length
		await api.log.clear().start({
			zombie_task_id: row.id,
		})
	} else {
		status = row.status === 'working' ? 'paused' : 'nothing'
	}

	const afterStatus = await ipcRenderer.invoke('changeStatus', {
		info: cloneDeep(row),
		processNumber: userStore.info.settings.collect_process_number,
		status,
	})
	if (afterStatus === 'working') show.log = true
	row.status = afterStatus
	row.switch = ['working', 'pending'].includes(afterStatus)
	console.log(afterStatus)
}, 800)

sockets.receive('zombie', (params) => {
	const {
		data: { task },
	} = params
	// debugger
	if (task) {
		if (!tableOptions.value.list.length) tableOptions.value.refresh()

		const taskItem = tableOptions.value.list.find((v) => v.id === task.id)

		if (taskItem) {
			if (task.status !== taskItem.status) {
				taskItem.switch = ['working', 'pending'].includes(task.status)
			}
			taskItem.status = task.status
		}
	}
})
</script>
