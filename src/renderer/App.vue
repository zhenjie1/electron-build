<template>
	<title-bar />
	<el-config-provider :locale="i18nt">
		<router-view v-slot="{ Component }" class="containerRoot">
			<component :is="Component" />
		</router-view>
	</el-config-provider>
	<landing-page></landing-page>
</template>

<script setup lang="ts">
import { $ref } from 'vue/macros'
import { ElConfigProvider } from 'element-plus'
import { isDev } from '@renderer/utils/tools'
import { i18n } from './i18n'
import TitleBar from './components/common/TitleBar.vue'
const { ipcRenderer } = require('electron')

const i18nt = computed(() => i18n.global.messages[i18n.global.locale].el)

if (!isDev) ipcRenderer.invoke('check-update')
</script>

<style scoped>
.containerRoot {
	height: calc(100vh - 30px);
	margin-top: 30px;
	width: 100%;
}
</style>
