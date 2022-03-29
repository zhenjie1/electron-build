<template lang="pug">
div(class="h-full pageTemplate overflow-hidden")
  div(class="observeEl" ref="observeEl")
    div(v-if="slots.tabs" class="topTabs mb-3")
      <slot name="tabs"></slot>
    div(v-if="slots.filter" class="filter")
      slot(name="filter")

  el-table(v-bind="tableData" :data="list" :max-height="height")
      slot(name="table") ''

  div(class='flex')
    el-pagination(
        v-model:currentPage="page.curPage"
        v-model:page-size="page.size"
        :page-sizes="[20, 40, 60, 80, 100]"
		class='m-auto'
        layout="total, sizes, prev, pager, next, jumper"
        :total="page.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
    )
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { useTableHeight } from '../../assets/js/useTableHeight'
import { useTableData } from './pageTable'
// eslint-disable-next-line no-duplicate-imports
import type { TableProps } from './pageTable'

const emits = defineEmits(['update:options'])
const slots = useSlots()
const { observeEl, height } = useTableHeight(-36)

const props = defineProps({
	awaitFetch: {
		type: Function as PropType<(...args: any[]) => any>,
		required: true,
	},
	tableData: {
		type: Object,
		default: () => ({}),
	},
} as TableProps)

// const { data: tableResult } = props.awaitFetch().start()
// console.log(tableResult)

const page = reactive({ curPage: 1, total: 965, size: 20 })
const { list, loading, data, refresh, response } = useTableData(props, page)

watch(data, (data) => {
	page.curPage = data.current_page
	page.total = data.total
})
const handleSizeChange = (size: number) => {
	page.size = size
	refresh()
}
const handleCurrentChange = (index: number) => {
	page.curPage = index
	refresh()
}

const options = reactive({ refresh, loading, list, page, response })
watch(
	() => options,
	(data) => {
		emits('update:options', data)
	},
	{
		deep: true,
	}
)
</script>
