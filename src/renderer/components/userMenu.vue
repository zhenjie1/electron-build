<template>
	<div class="user hover p-2" @click="handler">
		<el-avatar :src="info.avatar" shape="square" :size="30"></el-avatar>
		<!-- <img :src="info.avatar" class="w-8 h-8 mx-auto rounded-full overflow-hidden" alt="" /> -->
		<p class="name mt-1 leading-none overflow-hidden">{{ info.name }}</p>
	</div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@renderer/store'

const router = useRouter()
const { info } = useUserStore()

const handler = () => {
	router.push('/user/setter')
}
// userStore.info
</script>
