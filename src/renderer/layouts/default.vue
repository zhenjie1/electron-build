<template>
	<el-container class="containerDefault">
		<ip-disabled />

		<el-container>
			<el-aside width="60px" class="border-r border-gray-100">
				<layout-left-menu></layout-left-menu>
			</el-aside>
			<el-main class="!p-0">
				<router-view></router-view>
			</el-main>
		</el-container>
	</el-container>
</template>

<script lang="ts" setup>
import IpDisabled from '@renderer/components/confirm/IpDisabled.vue'
const route = useRoute()
</script>
