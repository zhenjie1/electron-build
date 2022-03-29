<template>
	<div class="leftMenu relative h-full">
		<ul>
			<li v-for="(item, index) in leftMenu" :key="index" class="item">
				<router-link
					:to="item.path"
					class="routerLink leading-16 block hover:bg-gray-100 px-3"
				>
					<!-- <i
						class="iconfont inline-block text-center leading-5 text-[16px] w-5"
						:class="[item.icon]"
					/> -->
					{{ item.title }}
				</router-link>
			</li>
		</ul>

		<div class="logout text-sm absolute bottom-0 w-full text-center">
			<UserMenu></UserMenu>
			<p class="leading-10 cursor-pointer text-$red hover:bg-gray-100" @click="logout">
				退出
			</p>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { clearUserData } from '@renderer/assets/js/tools'

const leftMenu = reactive([{ title: '首页', icon: 'icon-account', path: '/home' }])
const router = useRouter()
// const {} =
const logout = () => {
	clearUserData()
	router.push('/login')
}
</script>

<style lang="scss">
.routerLink.router-link-active {
	background-color: var(--mainTrans);
	color: var(--main);
	// border-right: 3px solid var(--main);
	.iconfont {
		color: var(--main);
	}
}
</style>
