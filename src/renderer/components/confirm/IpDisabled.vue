<script lang="ts" setup>
import { Close } from '@element-plus/icons-vue'
import { useSwitchStore } from '@store/index'
const { ipcRenderer } = require('electron')
const switchStore = useSwitchStore()

const show = ref(false)

watch(
	() => switchStore.data.ipDisabled,
	(val) => {
		show.value = val
	},
	{ immediate: true }
)

const close = () => switchStore.change('ipDisabled', false)
const solution = reactive(['重启您的 光猫 或 路由器', '下载代理软件'])

ipcRenderer.on('page503', () => {
	switchStore.change('ipDisabled', true)
})
</script>

<template>
	<div
		v-if="show"
		class="dialog fixed top-10 right-3 shadow-xl p3 px5 z-50 bg-white border border-gray-100 rounded-md w60"
	>
		<p class="flex justify-between mb4 items-center">
			<span class="title font-medium text-lg">IP 被封</span>
			<el-icon :size="20" class="cursor-pointer" @click="close"><Close /></el-icon>
		</p>
		<h3 class="text-base">解决方案：</h3>
		<ol class="mt-2 text-gray-500 text-sm">
			<li v-for="(item, index) in solution" :key="index" class="whitespace-nowrap">
				<span class="mr-1">{{ index + 1 }}.</span>
				<span>{{ item }}</span>
			</li>
		</ol>
	</div>
</template>
