import { ipcMain } from 'electron'
import cheerio, { Cheerio } from 'cheerio'
import { Page } from 'puppeteer-core'
import { regexPrice } from './price'
import { TaskAsin, TaskPage } from '../taskChild'
import { linkComplete } from '@main/utils/tools'
import { goto, urlPickAsin } from '@main/utils/parsePage'
import Parse from '../parse'

type Task = TaskAsin | TaskPage

type DetailParse = {
	page: Page
	url: string
	includeKeys?: string[]
	parse: Parse
	html?: string
}

type RulesBase = {
	id: number
	select: string
}
type Rule = RulesBase & (RuleText | RuleAttr)
type RuleText = { type: 'text' }
type RuleAttr = { type: 'attr'; attr: string | string[] }

let rules: { [key: string]: Rule[] } = {}
ipcMain.on('setRules', (_, data) => {
	rules = data
})

type HandlerParams = Rule & {
	val: string
	$html: Cheerio<Element>
	$el: Cheerio<Element>
	$els: Cheerio<Element>[]
	result: Data<string>
}
type Handler = {
	[key: string]: {
		before?: (params: HandlerParams) => string | number
		default: (params: HandlerParams) => string | number
		after?: (params: HandlerParams) => string | number
		[k: string]: (params: HandlerParams | any) => string | number
	}
}

type RankItem = { name: string; rank: number; url: string }

export const detailParse = async ({
	page,
	url,
	includeKeys,
	task,
	html,
}: DetailParse): Promise<Data> => {
	const link = new URL(url)
	console.log('parse url', url)

	const $ = cheerio.load(html)
	const $html = $('body')
	$html.find('script,style,link').remove()

	const staticReturn = ({ val }) => val
	const handles: Handler = {
		title: {
			default: staticReturn,
		},
		price: {
			default: ({ val }) => {
				return val
			},
			after: ({ val, $el }) => {
				let priceNum: any = val.match(/[0-9.,\s]+/)
				if (priceNum) priceNum = priceNum[0].replace(/\s/g, '')
				const symbol = val.match(/[^0-9.,\s]+/)
				if (priceNum && symbol) val = `${symbol}${priceNum}`

				return regexPrice(val)
			},
		},
		images: {
			default: staticReturn,
		},
		brand: {
			default: staticReturn,
			after: ({ val }) => {
				if (val) {
					const colon = /(.*):(.*)/.exec(val)
					if (colon && colon.length === 3) val = colon[2].trim()
					else {
						val = val.replace(/^(Brand:\s)/, '')
						val = val.replace(/^Visit the(.*)(Store).*$/, '$1').trim()
						val = val.replace(/De ([a-z]+) Store.*/i, '$1').trim()
						val = val.replace(/^Visiter la boutique (.*)$/, '$1').trim()
						val = val.replace(/Visita la Store de (.*)$/i, '$1').trim()
					}
				}
				return val
			},
		},
		asin: {
			default: staticReturn,
			before: () => {
				return urlPickAsin(url)
			},
		},
		ratings: {
			default: ({ val = '' }) => {
				const ratingsMatch = val.match(/(\d|,)+/)
				let ratings = ratingsMatch ? ratingsMatch[0] : ''

				ratings = ratings ? ratings.replace(',', '') : ratings
				return Number(ratings)
			},
		},
		score: {
			default: ({ val }) => val.split(' ')[0].replace(',', '.'),
		},
		marketUrl: {
			default: ({ val }) => {
				const link1 = /^\//.test(val)
				if (link1) link.origin + link1

				return val
			},
		},
		rank: {
			default: ({ val, select, id }) => {
				// console.log('rank ------------->', {select, id})
				return handles.rank.dealWith({ val } as any)
			},
			dealWith({ val }) {
				if (val.includes(':')) {
					val = `${val.split(':')[1]}`
				}
				if (val.includes('(') && val.includes(')')) {
					return `${val.split('(')[0]}&#13;${val.split(')')[1]}`
				}
				return val
			},
			dataWith(params: { text: string; link: string }[]) {
				const data = {
					big: {} as RankItem,
					small: [] as RankItem[],
				}
				params.map((v) => {
					const { link, text } = v
					const isBig = !link.match(/\/\d+\//)
					const rank = parseInt(text.replace(/.*?([\d,]+).*/, '$1').replace(/,/g, ''))

					if (isBig) {
						data.big = { url: link, name: text.trim(), rank }
					} else {
						data.small.push({ url: link, name: text.trim(), rank })
					}
				})

				return data as any
			},
			0({ $el }) {
				const ranksHtml = $el.children('span').html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						return {
							text: el.text(),
							link: el('a').attr('href'),
						}
					})

				return handles.rank.dataWith(ranks)
			},
			1({ $el }) {
				const ranksHtml = $el.children('span').html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						if (el.text().includes('(')) {
							return {
								text: el.text().split('(')[0],
								link: el('a').attr('href'),
							}
						} else {
							return {
								text: el.text(),
								link: el('a').attr('href'),
							}
						}
					})

				return handles.rank.dataWith(ranks)
			},
			2({ $el }) {
				const ranksHtml = $el.children('span').html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						if (el.text().includes(':')) {
							const bightml = $$.text()
							const bigurl = $$('a').attr('href')
							return {
								text: bightml.split('(')[0],
								link: bigurl,
							}
						} else {
							if (el.text().includes('(')) {
								return {
									text: el.text().split('(')[0],
									link: el('a').attr('href'),
								}
							} else {
								return {
									text: el.text(),
									link: el('a').attr('href'),
								}
							}
						}
					})
				return handles.rank.dataWith(ranks)
			},
			3({ $el }) {
				const ranksHtml = $el.children('span').html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						if (el.text().includes(':')) {
							const bightml = $$.text()
							const bigurl = $$('a').attr('href')
							return {
								text: bightml.split('(')[0],
								link: bigurl,
							}
						} else {
							return {
								text: el.text(),
								link: el('a').attr('href'),
							}
						}
					})
				return handles.rank.dataWith(ranks)
			},
			8({}) {
				const $desMeilleures = $html.find(
					'th.a-color-secondary.a-size-base.prodDetSectionEntry'
				)
				if ($desMeilleures.length) {
					const desMeilleures = $desMeilleures[$desMeilleures.length - 2]
					const isRank = /Rank/i.test($(desMeilleures).text().trim())
					if (isRank) {
						return $(desMeilleures)
							.next()
							.text()
							.trim()
							.replace(/\(.*\)/, '')
					}
				}
				const defaultRank = $html
					.find(
						'#productDetails_db_sections #productDetails_detailBullets_sections1 th:contains("Amazon") + *'
					)
					.first()
					.text()

				return handles.rank.dealWith({ val: defaultRank } as any)
			},
			12({ $el }) {
				const smallList = $el
					.children('ul')
					.find('.a-list-item')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						return {
							text: el.text(),
							link: el('a').attr('href'),
						}
					})
				$el.children('ul').remove()
				const bigText = $el.text()
				const bigLink = $el.find('a').attr('href')
				smallList.push({ text: handles.rank.dealWith({ val: bigText }), link: bigLink })
				console.log('smallList ->', smallList)
				return handles.rank.dataWith(smallList)
			},
			14({ $el }) {
				return handles.rank['12']({ $el })
			},
			15({ $el }) {
				const ranksHtml = $el.next().html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						if (el.text().includes('(')) {
							return {
								text: el.text().split('(')[0],
								link: el('a').attr('href'),
							}
						} else {
							return {
								text: el.text(),
								link: el('a').attr('href'),
							}
						}
					})
				return handles.rank.dataWith(ranks)
			},
			16({ $el }) {
				const ranksHtml = $el.next().html()
				const $$ = cheerio.load(ranksHtml)
				const ranks = $$('span')
					.toArray()
					.map((span) => {
						const el = cheerio.load(span)
						if (el.text().includes('(')) {
							return {
								text: el.text().split('(')[0],
								link: el('a').attr('href'),
							}
						} else {
							return {
								text: el.text(),
								link: el('a').attr('href'),
							}
						}
					})
				return handles.rank.dataWith(ranks)
			},
		},
		is_fba: {
			handler({ shipsFrom, soldBy, val }) {
				// 亚马逊自营或亚马逊第三方卖家
				if (shipsFrom.includes('Amazon')) return 1
				else {
					if (val.includes('Currently unavailable')) return -1
					return 0
				}
			},
			default({ val }) {
				if (val) {
					return handles.is_fba.handler({ shipsFrom: val, val })
					// const t1 = val.toLocaleLowerCase().includes('amazon')
					// const t2 = !val.includes('Currently unavailable')
					// return t1 && t2 ? 1 : 0
				}
				return -1
			},
			1: ({ $el, val }) => {
				const shipsFrom = $el.children('.tabular-buybox-text:eq(0)').text().trim()
				const soldBy = $el.children('.tabular-buybox-text:eq(1)').text().trim()
				return handles.is_fba.handler({ shipsFrom, soldBy, val })
			},
			5: ({ $els }) => {
				return $els.map(($el) => $el.text()).join('')
			},
		},
		shopping_cart_market: {
			after: ({ val }) => {
				return val.toLocaleLowerCase().includes('amazon') ? 'Amazon' : val
			},
			default: staticReturn,
		},
		seller_id: {
			default: staticReturn,
			after: ({ val }) => {
				if (!val) return val

				const id = /&(seller=)([^&]+)/.exec(val)
				if (id && id.length) return id[2]
			},
		},
		min_price: {
			default: staticReturn,
			after: ({ val }) => {
				if (!val) return val
				return regexPrice(val)
			},
		},
		follow_count: {
			default: ({ val }) => {
				if (!val) return val

				const regexTarget = /\((\d+)\)/.exec(val)
				if (regexTarget) return regexTarget[1]
			},
		},
		delivery_fee: {
			default: ({ val }) => {
				if (val.includes('FREE delivery')) return 0

				const isFree = val.split(':')[0].match(/[\d,.]+/)
				isFree ? (val = isFree[0]) : (val = val.split(':')[0].trim())

				val = val.replace(',', '.')
				return val || 0
			},
			after: ({ val }) => {
				const number = parseInt(val)
				if (Number.isNaN(number)) {
					const text = $html
						.find(
							'#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE > span'
						)
						.text()

					if (text.includes('FREE delivery')) return 0
				}

				return val
			},
			'0': ({ val }) => {
				if (!val) return

				const fee = /[\d.?\d]+/.exec(val)
				if (fee) return fee[0]
			},
		},
		stock: {
			default: staticReturn,
			0: () => 'outOfStock',
			5: ({ $el }) => {
				if ($el.length == 0) return 'outOfStock'
				return 'inStock'
			},
			after: ({ val }) => {
				if (val) return val === 'outOfStock' ? 0 : 1
				return -1
			},
		},
		country: {
			default: ({ val }) => {
				return val
			},
		},
		is_cn_seller: {
			default: staticReturn,
			// 	// before: ({ val, result, info }) => {
			// 	// 	if (result.shopping_cart_market.indexOf('Amazon') !== -1 && countrySite === 'Y') return 'Amazon'
			// 	// }
		},
		seller_market: {
			default: ({ result }) => result.shopping_cart_market,
		},
		seller_country: {
			default: ({ result }) => result.is_cn_seller,
		},
		first_available: {
			default: staticReturn,
		},
	}

	// 获取规则的 val | text | attr...
	const ruleSingleGetValue = (v) => {
		const { $el } = v
		const val = (() => {
			const call = {
				val: () => $el.val().trim(),
				text: () => $el.text().trim(),
				attr: (v) => {
					if (!Array.isArray(v.attr)) throw new Error('attr 只能是数组类型')
					const attr = v.attr.find((k) => $el.attr(k))
					if (attr) return $el.attr(attr).trim()
				},
			}

			if (!v.type) throw new Error('缺少 type 规则')
			if (!call[v.type]) throw new Error('缺少对应处理程序')

			return call[v.type](v)
		})()
		return val
	}

	// 获取数据
	const data = Object.keys(rules).reduce((dataResult, k) => {
		if (!handles[k]) throw new Error(`未找到对应处理程序1 ${k}`)
		if (includeKeys && !includeKeys.includes(k)) return dataResult

		for (const v of rules[k]) {
			// if (k === 'rank') console.log('rank rules ->', v)
			if (!v.select) throw new Error('规则缺少 select 值')
			// 获取对应处理程序
			const callback = handles[k][v.id] || handles[k].default
			if (!callback) throw new Error('未找到对应处理程序2')

			const selects = Array.isArray(v.select) ? v.select : [v.select]
			// 只要有一个元素未找到，代表不符合此条件
			if (!selects.every((s) => $html.find(s).length > 0)) {
				continue
			}

			const $el = $html.find(selects[0]).first()
			const $els = selects.map((v) => $html.find(v).first())

			const params: HandlerParams = { ...v, $el, $els, result: dataResult }
			try {
				params.val = ruleSingleGetValue(params)
			} catch (error) {
				console.error('获取 val 异常', k, v, 'url', url)
				console.error(error)
			}

			let result
			if (handles[k].before) {
				try {
					result = handles[k].before(params)
					if (result) params.val = result
				} catch (error) {
					console.error('before error', k, v, 'url', url)
					console.error(error)
				}
			}

			try {
				result = callback(params)
			} catch (error) {
				console.error('default error', k, v)
				console.error(error)
			}

			try {
				if (handles[k].after) result = handles[k].after({ ...params, val: result })
			} catch (error) {
				console.error('after error', k, v, 'url', url)
				console.error(error)
			}

			// 获取到值了，跳出循环
			if (![undefined].includes(result)) {
				// console.log('跳出循环', k, v.id, result)
				dataResult[k] = result
				break
			}
		}
		return dataResult
	}, {})

	try {
		const staticKeys = ['seller_market', 'seller_country', 'is_cn_seller']
		staticKeys.map((k) => {
			if (!handles[k]?.default) return
			data[k] = handles[k].default({ result: data, $html })
		})
	} catch (err) {
		console.error('staticKeys -> ', err)
	}

	return data
}

/**
 * 单个商品解析
 */
export const signleGoodsParse = async (options: DetailParse): Promise<Data & { page: Page }> => {
	console.log('start parse goods data')
	const html = await options.page.evaluate(() => {
		return document.body.innerHTML
	})

	const goodsData = await detailParse({ ...options, html })

	const asin = (() => {
		const decodeUrl = decodeURIComponent(options.url)
		if (decodeUrl.includes('/dp/')) {
			if (decodeUrl.includes('dp/product')) {
				return decodeUrl.replace(/.+\/dp\/product\/(\w+).+/, '$1')
			} else {
				return decodeUrl.replace(/.+\/dp\/(\w+).+/g, '$1')
			}
		}
	})()
	goodsData.asin = asin
	goodsData.page = options.page
	console.log('详情 解析成功')

	const isBuyBox = await isEntryBuyBox(options.page)
	if (isBuyBox) {
		const buyBoxData = await getBuybox({ ...options, asin: goodsData.asin })
		goodsData.page = buyBoxData.page
		for (const i in buyBoxData) {
			if (i === 'page') continue
			if (![undefined, null].includes(buyBoxData[i])) goodsData[i] = buyBoxData[i]
		}
		console.log('购物车 解析成功')
	}
	// 获取所属国
	if (options.parse.task.isCountry && goodsData.marketUrl) {
		const countryData = await getCountry(goodsData.marketUrl, options)
		goodsData.page = countryData.page
		if (countryData.country) {
			goodsData.is_cn_seller = countryData.country === 'CN' ? 1 : 0
			goodsData.seller_country = countryData.country
		}
		console.log('所属国 解析成功')
	}

	return goodsData as Data & { page: Page }
}

// 是否需要进入购物车
async function isEntryBuyBox(page: Page): Promise<boolean> {
	const isEntry = await page.evaluate((): boolean => {
		const isEntry = document.querySelector('#unqualifiedBuyBox_feature_div')
		return !!isEntry
	})
	return isEntry
}

// 购物车处理
async function getBuybox(options: DetailParse & { asin: string }): Promise<Data & { page: Page }> {
	const { page, parse, asin } = options
	const isEntry = isEntryBuyBox(options.page)
	if (!isEntry) {
		console.log('无需进入购物车')
		return { page }
	}
	const url = `${parse.task.domain}gp/aod/ajax/ref=dp_aod_unknown_mbc?asin=${asin}&m=&qid=&smid=&sourcecustomerorglistid=&sourcecustomerorglistitemid=&sr=&pc=dp`
	const { page: newPage } = await goto({ page, url, parse })
	options.page = newPage
	if (!parse.task.isWorking()) return { page: options.page }

	const html = await page.content()
	return detailParse({ ...options, html })
		.then((data) => {
			data.page = options.page
			return data as Data & { page: Page }
		})
		.catch((error) => {
			console.error('获取购物车数据报错')
			console.error(error)
			return { page: options.page }
		})
}

/**
 * 获取所属国
 */
async function getCountry(url: string, options: DetailParse): Promise<Data & { page: Page }> {
	if (!url) {
		console.error('需要获取所属国，但没有参数： url')
		return { page: options.page }
	}
	url = linkComplete(url, options.parse.task.domain)

	const { parse } = options
	const { page: newPage } = await goto({ parse, url, page: options.page })

	if (!options.parse.task.task.isWorking()) return { page: newPage } as Data & { page: Page }
	const html = await options.page.content()

	return await detailParse({ ...options, html })
		.then((res = {}) => {
			res.page = newPage
			return res as Data & { page: Page }
		})
		.catch((error) => {
			console.error('所属国 解析异常')
			console.error(error)
			return { page: newPage } as Data & { page: Page }
		})
}
