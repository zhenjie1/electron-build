export type TaskStatus = 'nothing' | 'working' | 'paused' | 'finish' | 'warning' | 'pending'

export type TaskMarketCategory = {
	id: number
	source: string
	site_id: number
	country_code: string
	category_name: string
	category_name_cn: string
	category_id: number
	category_parent_id: number
	local_parent_id: number
	has_children: number
	is_parent: number
	path_name: string
	path_name_cn: string
	path_id: string
	product_type: string
	attributes: string[]
	attributes_count: number
	status: number
}

export type TaskMarketSite = {
	id: number
	source: string
	market_place: string
	country: string
	country_code: string
	currency_code: string
	currency_symbol: string
	endpoint: string
	market_place_id: string
	flag: string
	region: string
	status: string
	language: string
	site_domain: string
	charset: string
	seller_central_url: string
	language_code: string
	last_updated_at: string
}

export type TaskInfo = {
	id: number
	market_site_id: number
	/**
	 * 关键字
	 */
	keyword: string
	page: number
	max_page: number
	/**
	 * all: 所有商品
	 * zombie: 僵尸商品
	 */
	type: 'all' | 'zombie'
	/**
	 * 采集方式
	 */
	mold: 0 | 1 | 2 | 3
	/**
	 * 店铺或分类地址
	 */
	collect_url: string
	status: TaskStatus
	asins?: string
	asins_array?: string[]
	category_id: number
	filters: {
		prices: [number, number]
		reviews: [number, number]
		pages: [string, string]
		country_site: 'Y' | 'N'
		isFba: string
	}
	attrs: {
		/**
		 * 分类采集时，分类的地址
		 */
		model: string[]
		data: any[]
	}
	created_at: string
	updated_at: string
	deleted_at: string
	/**
	 * 采集方式
	 */
	ui_mold: string
	page_nums: number
	market_site: TaskMarketSite
	/**
	 * 选择的分类数据
	 */
	market_category: TaskMarketCategory
}
