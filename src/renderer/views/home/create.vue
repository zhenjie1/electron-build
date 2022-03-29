<script lang="ts" setup>
import api from '@renderer/api'
import { getCategory } from '@renderer/assets/js/category'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash'
import { PropType } from 'vue'
const { shell } = require('electron')

const $emits = defineEmits(['close', 'refresh'])
const props = defineProps({
	country: {
		type: Object as PropType<Data[]>,
		default: () => {},
	},
})

const collectType = reactive({
	check: 0,
	data: [
		{ value: 0, label: '关键词' },
		{ value: 1, label: '店铺' },
		{ value: 2, label: '分类' },
		{ value: 3, label: 'ASIN' },
	],
})

const form = reactive({
	country: '',
	keyword: '',
	collectType: 0,
	collect_url: '',
	categoriesData: [],
	asins: '',
	page: [],
	price: [],
	review: [],
	stock: 'all',
	other: false,
	siteCountry: false,
	warehouse: 'all',
})
const countryCheck = computed(() => {
	if (!form.country) return
	return props.country.find((v) => v.id === form.country)
})
const rules = {
	country: [{ required: true, message: '请选择国家', trigger: 'change' }],
	keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
	collect_url: [{ required: true, message: '请输入店铺链接', trigger: 'change' }],
}
// 浏览器打开链接
const gotoLink = () => {
	const link = countryCheck.value?.site_domain
	if (link) shell.openExternal(link)
}

// 修改采集类型
const collectTypeChange = (value) => {
	if (value == 2 && !form.country) {
		ElMessage.error('请选择国家')
		form.collectType = 0
	}
}

const category = ref([])
const categoryCheck = ref([])
const categoryLoading = ref(false)
// 搜索分类
const searchCategory = async () => {
	if (!form.country) return ElMessage.error('请选择国家')
	const country = props.country.find((v) => v.id == form.country)
	categoryLoading.value = true
	category.value = await getCategory(
		form.keyword,
		country.site_domain,
		countryCheck.value.language_code
	).finally(() => {
		categoryLoading.value = false
	})
}
const categoriesProps = {
	lazy: true,
	checkStrictly: true,
	lazyLoad(node, resolve) {
		const { data } = node
		const { success } = api.home.getCategories().start({
			site_id: form.country,
			category_id: data.value,
		})
		success((data) => {
			resolve(
				data.map((v) => ({
					value: v.id,
					label: v.category_name_cn,
				}))
			)
		})
	},
}

const disabledPrice = computed(() => {
	return form.stock !== 'all'
})
const formEl = ref()
const show = ref(true)

const submitHandler = () => {
	formEl.value.validate((valid) => {
		if (!valid) return
		if (form.collectType !== 3 && (!form.page[0] || !form.page[1])) {
			return ElMessage.error('请输入页数')
		}
		const data = cloneDeep({
			market_site_id: form.country,
			mold: form.collectType.toString(),
			type: form.stock,
			collect_url: form.collect_url,
			asins: form.asins,
			keyword: form.keyword,
			attrs: {
				data: category.value,
				model: categoryCheck.value,
			},
			category_id: form.categoriesData.at(-1),
			filters: {
				country_site: form.siteCountry ? 'Y' : 'N',
				pages: form.page,
				prices: form.price,
				reviews: form.review,
				isFba: form.warehouse,
			},
		})
		const { success } = api.home.createTask().start(data)
		success(() => {
			$emits('close')
			$emits('refresh')
			ElMessage.success('创建成功')
		})
	})
}
</script>

<template>
	<el-dialog v-model="show" title="创建任务" width="500px" @close="$emit('close')">
		<el-form ref="formEl" :model="form" :rules="rules" label-width="80px">
			<el-form-item label="国家" prop="country">
				<div class="flex w-full">
					<el-select v-model="form.country" class="flex-1 mr-3">
						<el-option
							v-for="item in props.country"
							:key="item.id"
							:label="item.country"
							:value="item.id"
						></el-option>
					</el-select>
					<el-button @click="gotoLink">跳转</el-button>
				</div>
			</el-form-item>
			<el-form-item label="采集类型" prop="collectType">
				<el-select v-model="form.collectType" class="w-full" @change="collectTypeChange">
					<el-option
						v-for="item in collectType.data"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					></el-option>
				</el-select>
			</el-form-item>
			<el-form-item v-if="form.collectType === 0" prop="keyword" label="关键词">
				<div class="flex w-full">
					<el-input
						v-model="form.keyword"
						placeholder="请输入关键词"
						class="mr-3 flex-1"
					></el-input>
					<el-button :loading="categoryLoading" @click="searchCategory">
						获取分类
					</el-button>
				</div>
				<el-cascader
					v-if="category.length"
					v-model="categoryCheck"
					clearable
					:options="category"
					:props="{ checkStrictly: true }"
					class="mt-3 w-full"
				></el-cascader>
			</el-form-item>
			<el-form-item v-else-if="form.collectType === 1" label="店铺链接" prop="collect_url">
				<el-input
					v-model="form.collect_url"
					placeholder="请输入店铺链接"
					clearable
				></el-input>
			</el-form-item>
			<el-form-item v-else-if="form.collectType === 2" label="分类" required>
				<el-cascader
					v-model="form.categoriesData"
					class="w-full"
					:props="categoriesProps"
				></el-cascader>
			</el-form-item>
			<el-form-item v-else-if="form.collectType === 3" label="ASIN">
				<el-input
					v-model="form.asins"
					type="textarea"
					placeholder="请输入产品ASIN"
					:rows="5"
				></el-input>
			</el-form-item>
			<el-form-item v-if="form.collectType !== 3" label="采集页数" required>
				<div class="flex w-full">
					<el-input v-model="form.page[0]" placeholder="开始页码"></el-input>
					<span class="mx-3">至</span>
					<el-input v-model="form.page[1]" placeholder="结束页码"></el-input>
				</div>
			</el-form-item>
			<el-form-item v-if="form.collectType !== 3" label="价格区间">
				<div class="flex w-full">
					<el-input
						v-model="form.price[0]"
						:disabled="disabledPrice"
						placeholder="最低价格"
					></el-input>
					<span class="mx-3">至</span>
					<el-input
						v-model="form.price[1]"
						:disabled="disabledPrice"
						placeholder="最高价格"
					></el-input>
				</div>
			</el-form-item>
			<el-form-item v-if="form.collectType !== 3" label="reviews">
				<div class="flex w-full">
					<el-input
						v-model="form.review[0]"
						:disabled="disabledPrice"
						placeholder="最小评论数"
					></el-input>
					<span class="mx-3">至</span>
					<el-input
						v-model="form.review[1]"
						:disabled="disabledPrice"
						placeholder="最大评论数"
					></el-input>
				</div>
			</el-form-item>
			<el-form-item v-if="form.collectType !== 3" label="库存" required>
				<el-radio v-model="form.stock" label="all">所有</el-radio>
				<el-radio v-model="form.stock" label="zombie">无库存商品</el-radio>
			</el-form-item>
			<el-form-item v-if="form.collectType !== 3" label="高级">
				<el-checkbox v-model="form.other">
					<span class="text-$red">高级选项采集因采集数据较多会影响采集速度</span>
				</el-checkbox>
			</el-form-item>
			<div v-show="form.other" v-if="form.collectType !== 3">
				<el-form-item label="所属国">
					<el-checkbox v-model="form.siteCountry">获取所属国</el-checkbox>
				</el-form-item>
				<el-form-item label="配送仓">
					<el-radio v-model="form.warehouse" label="all">所有</el-radio>
					<el-radio v-model="form.warehouse" label="1">FBA</el-radio>
					<el-radio v-model="form.warehouse" label="0">FBM</el-radio>
				</el-form-item>
			</div>
			<el-form-item label="说明">
				<span class="text-$red leading-normal mt-1">
					选择国家后点击跳转打开对应网站， 配送地址输入邮编：XXXXX，再执行采集任务。
				</span>
			</el-form-item>
		</el-form>
		<template #footer>
			<span class="dialog-footer">
				<el-button @click="show = false">取消</el-button>
				<el-button type="primary" @click="submitHandler">创建</el-button>
			</span>
		</template>
	</el-dialog>
</template>
