import { AxiosResponse } from 'axios'
import type { ExtractPropTypes, Prop, Ref, ShallowRef } from 'vue'
export type PageTableParams = {
	tableData: Data
	awaitFetch: (page: Page) => any
}

type Page = {
	size: number
	index: number
}

export type TableProps = {
	awaitFetch: Prop<(...args: any[]) => any>
	tableData: Prop<Data>
}

export type TablePage = {
	curPage: number
	total: number
	size: number
}

export function useTableData(
	props: Readonly<ExtractPropTypes<TableProps>>,
	page: TablePage,
	params: Data = {}
) {
	const concatParam = () => {
		params.page = page.curPage
		params.limit = page.size
	}

	concatParam()
	console.log(params)
	const { data, loading, start, response } = props.awaitFetch().start(params)
	const list = computed(() => data.value?.data || [])

	const refresh = () => {
		concatParam()
		start(params)
	}

	return {
		data,
		list,
		loading,
		refresh,
		response,
	}
}

export type TableOptions = {
	refresh: () => void
	loading: Ref<boolean>
	data: Data
	list: Data[]
	page: TablePage
	response: ShallowRef<AxiosResponse>
}
