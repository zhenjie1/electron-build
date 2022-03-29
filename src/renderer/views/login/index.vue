<template>
	<div class="login relative h-full">
		<div class="bg bg-$main h-[45%]"></div>
		<div
			class="logo absolute left-1/2 top-[20%] transition -translate-x-1/2 text-center text-white"
		>
			<h3 class="text-5xl whitespace-nowrap">NIU-BOX</h3>
			<p class="text-lg mt-3 whitespace-nowrap">高效智能管理店铺，助力跨境出海发展</p>
		</div>
		<el-form
			ref="formRef"
			:model="formData"
			:rules="rules"
			label-width="66px"
			class="w-100 bg-white shadow rounded-md p-5 absolute left-1/2 top-[53%] transform -translate-x-1/2 -translate-y-1/2 border border-gray-50"
			@submit.prevent="submit"
		>
			<h1 class="title text-2xl text-center mb-4">登录</h1>
			<el-form-item label="账号" prop="username">
				<el-input v-model="formData.username" placeholder="请输入账号"></el-input>
			</el-form-item>
			<el-form-item label="密码" prop="password">
				<el-input
					v-model="formData.password"
					class="flex-1"
					type="password"
					placeholder="请输入密码"
				></el-input>
			</el-form-item>
			<el-form-item label="图形码" prop="code">
				<div class="flex w-full">
					<el-input
						v-model="formData.code"
						class="flex-1"
						placeholder="请输入图形码"
					></el-input>
					<img
						v-if="imgData"
						:src="imgData.captcha_image_content"
						alt="图形码"
						class="h-8 ml-2"
						@click="imgStart"
					/>
				</div>
			</el-form-item>
			<el-form-item>
				<el-button
					type="primary"
					:disabled="disabled"
					:loading="loading"
					native-type="submit"
					class="w-full"
				>
					登录
				</el-button>
			</el-form-item>
		</el-form>

		<footer class="text-center absolute left-1/2 bottom-[5%] text-xs -translate-x-1/2">
			<p class="whitespace-nowrap">
				邮箱：niubeiwangluokeji@163.com官网网址：www.niu-box.com
			</p>
			<p class="whitespace-nowrap">备案号： 豫ICP备2021019154号-1</p>
		</footer>
	</div>
</template>

<script lang="ts" setup>
import api from '@renderer/api/index'
import type { ElForm } from 'element-plus'
import { useUserStore } from '@store/index'
import { initSocket } from '@renderer/assets/js/ws'
type FormInstance = InstanceType<typeof ElForm>
const router = useRouter()
const userStore = useUserStore()

const { data: imgData, start: imgStart } = api.login.getCode()
imgStart()

const formData = reactive({
	username: '',
	password: '',
	code: '',
})

const formRef = ref<FormInstance>()

function useLogin() {
	const disabled = computed(() => !formData.username || !formData.password || !formData.code)
	const { start: loginStart, fail, loading, data } = api.login.login()
	fail(imgStart)

	const submit = () => {
		if (!formRef.value) return

		formRef.value.validate(async (valid) => {
			if (!valid) return
			await loginStart({
				email: formData.username,
				password: formData.password,
				captcha: formData.code,
				captcha_key: imgData.value?.captcha_key,
			})

			userStore.setInfo(data.value.user)
			userStore.setToken(data.value.user.api_token)
			initSocket()
			router.push('/home')
			setTimeout(() => {
				location.reload()
			}, 100)
		})
	}
	return {
		submit,
		loading,
		disabled,
	}
}

const { submit, disabled, loading } = useLogin()

const rules = {
	username: [{ required: true, message: '请输入用户名' }],
	password: [{ required: true, message: '请输入密码' }],
	code: [{ required: true, message: '请输入图形码' }],
}
</script>

<route lang="yaml">
meta:
    layout: fullScreen
</route>
