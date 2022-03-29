import { Browser, Page } from 'puppeteer-core'
import type { Optional } from 'utility-types'
import {
	createBrowser,
	createPage,
	entryPageSetAddress,
	getAsinHref,
	getNextPageUrl,
	goto,
	pageSetAddress,
	urlPickAsin,
} from '@main/utils/parsePage'
import {
	createPromise,
	delayWait,
	getLastPageNum,
	getPageIndex,
	getSpecifyPage,
	getUserAgent,
	linkComplete,
	tryCatch,
} from '@main/utils/tools'
import { TaskAsin, TaskPage } from './taskChild'
import { signleGoodsParse } from './asinParse/index'
import { mainWindow } from '..'

import getBrandData from './asinParse/brand'

type Task = TaskAsin | TaskPage

type Pages = {
	index: number
	asinIndex: number
}

type Options = {
	browser: Browser
	page: Page
	pages: Pages
	asins: string[]
	syncNum: number
}

export default class Parse {
	task: Task
	/**
	 * 延迟时间
	 */
	delayTime: [number, number]
	/**
	 * 不使用代理时的延迟时间
	 */
	localDelayTime: [number, number]
	browser: Browser

	ua: string

	constructor(options: { task: Task }) {
		this.task = options.task
		// 使用 代理ip 的延迟速度
		this.delayTime = [1000, 2000]
		// 使用 用户自身 跑任务时，降低速度，防止被封
		this.localDelayTime = [3000, 5000]
	}

	/**
	 * 单 asin 解析
	 * @param {string} url 地址
	 * @param {object} options options
	 * @param {puppeteer.Browser} options.browser browser
	 * @returns {Promise<object>}
	 */
	async parseSingleAsin(url: string, options: { pages: Pages }): Promise<Data> {
		tryCatch(() => {
			const newUrl = new URL(url)
			newUrl.searchParams.append('psc', '1')
			newUrl.searchParams.append('language', this.task.info.market_site.language_code)
			url = newUrl.href
		})
		console.log('单页解析开始', url)
		const { pages } = options
		const browser = this.browser
		// 如果使用代理ip， 等待时长短
		// const times = this.task.proxy ? this.delayTime : this.localDelayTime
		// await delayWait.apply(null, times)

		let p = await createPage(browser)
		tryCatch(() => p.setUserAgent(this.ua), false)

		const { page } = await goto({ parse: this, url, page: p })
		// 是否是无效的、不存在的 asin
		if (!this.task.isWorking()) return {}
		p = page
		// 页面是否有效 true: 无效， false 有效
		const isNotGoods = (await p.title()).includes('Page Not Found')

		if (isNotGoods) {
			const asin = urlPickAsin(url)
			this.task.task.log({
				url,
				log: `[${asin}] 详情解析成功, 发送数据：否；原因：asin无效`,
				status: 'success',
			})
			tryCatch(() => p.close())

			return { asin }
		}
		// 每过5个设置一次地址，防止地址被丢
		await entryPageSetAddress(p, this.task, { curPage: pages.asinIndex }).catch((error) => {
			console.error('页面设置地址，失败', error)
		})

		const detailData = await signleGoodsParse({ page: p, url, parse: this })
		p = detailData.page

		delete detailData.page
		detailData.status = 'active'

		let reason = ''
		const notSend = (val) => {
			reason = val
			return false
		}
		const isSend = ((): boolean => {
			const send = true
			if (isNotGoods) return notSend('asin 无效')
			if (!detailData.title) return notSend('没有标题')

			// asin 采集
			if (this.task.info.mold == 3) return true

			const {
				prices: [minPrice, maxPrice],
				reviews: [minReviews, maxReviews],
			} = this.task.info.filters
			const { price = 0, ratings = 0 } = detailData
			if (minPrice && price < minPrice) {
				return notSend(`价格不符，最小价格: ${minPrice}, 当前价格： ${price}`)
			}
			if (maxPrice && price > maxPrice) {
				return notSend(`价格不符，最大价格: ${maxPrice}, 当前价格： ${price}`)
			}
			if (minReviews && ratings < minReviews) {
				return notSend(`评论不符，最小评论: ${minReviews}, 当前评论： ${ratings}`)
			}
			if (maxReviews && ratings > maxReviews) {
				return notSend(`评论不符，最小评论: ${maxReviews}, 当前评论： ${ratings}`)
			}

			// 无库存
			if (this.task.info.type == 'zombie' && detailData.stock !== 0) {
				return notSend('库存：此商品不是无库存商品')
			}

			// 配送方过滤
			const isFba = this.task.info.filters.isFba
			const isAll = ['all', null, undefined].includes(isFba)
			if (!isAll && isFba != detailData.is_fba) return notSend('配送仓条件不符')
			return send
		})()
		console.log('解析完成, 是否发送', isSend, reason, detailData.asin)
		const logReason = !isSend ? '；原因：' + reason : ''
		this.task.task.log({
			url,
			log:
				`[${detailData.asin}] 详情解析成功, 发送数据：${isSend ? '是' : '否'} ` + logReason,
			status: 'success',
		})
		tryCatch(() => p.close())

		brandAndSend.call(this)

		/**
		 * 将下面的代码放入单独的函数中，这样做的目的是 使调用 parseSingleAsin 的地方，无需等待下面代码的执行
		 */
		async function brandAndSend() {
			if (detailData.brand) {
				detailData.brand_status = await getBrandData(
					detailData.brand,
					this.task.proxy
				).catch(() => [])
			}

			const sendData = {
				params: {
					goods_data: detailData,
					id: this.task.info.id,
					url: url,
				},
				event: 'zombie',
				type: 'goods:collect',
			}

			console.log(detailData)

			if (isSend) {
				mainWindow.webContents.send('sendGoodData', sendData)
			}
		}
		return detailData
	}

	// 当前状态是否处于工作中
	isWorking(log: string) {
		const isStart = this.task.status === 'working'
		if (log && !isStart) console.log('任务暂停', this.task.status, log)

		return isStart
	}

	/**
	 * 处理 asin 列表
	 * @param {Task} task task
	 * @param {object} options options
	 * @param {string[]} options.asins asin 列表
	 * @param {number} options.syncNum 同时跑的个数
	 * @param {puppeteer.Browser} options.browser browser
	 * @param {{ index: number }} options.pages options
	 */
	async handlerAsinList(options: Pick<Options, 'asins' | 'syncNum'> & Optional<Options>) {
		// 非开始状态
		if (!this.isWorking('asin 列表')) return console.log('非运行状态，放弃解析')
		const { asins, syncNum, pages = {} as Pages } = options
		if (asins.length === 0) return console.error('未发现 asinList 数据')
		let { browser } = options
		if (!browser) browser = await createBrowser(this.task.proxy)
		this.browser = browser
		pages.asinIndex = -1

		const { resolve, p: promise } = createPromise<void>()

		const handler = async (asins: string[]) => {
			pages.asinIndex++
			if (!asins[pages.asinIndex]) return console.log('未找到 asinIndex ', pages.asinIndex)
			// 非开始状态
			if (!this.isWorking('asin 列表， 单个解析')) return console.log('非工作状态')

			const asinPath = linkComplete(asins[pages.asinIndex], this.task.domain)
			// 每10个换一个 userAgent，设置一次地址
			if (pages.asinIndex % 10 === 0) {
				this.ua = getUserAgent()
			}

			let error
			const goodsData = await this.parseSingleAsin(asinPath, { pages }).catch((e) => {
				error = e
				console.error('解析单页面异常')
				console.error(e)
				// if (e === 'translate')
				return {} as Data
			})

			if (error === 'translate') return console.log('被转移了，终止任务')

			// 执行回调
			if (asins[pages.asinIndex]) {
				try {
					this.task.asinCallback.call(this.task, {
						pages,
						url: asinPath,
						asin: goodsData.asin,
					})
				} catch (e) {
					console.error('执行回调异常', 'task.asinCallback')
					console.error(e)
				}
			}

			// 有则继续，无则完成
			asins[pages.asinIndex + 1] ? handler(asins) : resolve()
		}

		for (let i = 0; i < syncNum; i++) await handler(asins)

		return promise.finally(async () => {
			setTimeout(() => {
				if (browser.isConnected()) tryCatch(() => browser?.close())
			}, 10 * 1000)
		})
	}

	/**
	 * 单页解析
	 * @param {string} url 地址
	 * @param {Task} task task
	 * @param {object} options options
	 * @param {{ index: number }} options.pages options
	 * @returns {Promise<{ nextPageUrl: string }>}
	 */
	async parseSinglePage(
		url: string,
		options: Pick<Options, 'pages'>
	): Promise<{ nextPageUrl: string }> {
		const beforeOfferingClose = (browser?: Browser) => {
			// if (browser && browser.isConnected()) tryCatch(() => browser.close())
			return { nextPageUrl: '' }
		}
		// 非开始状态
		if (!this.isWorking('单页解析')) return beforeOfferingClose()

		url = linkComplete(url, this.task.domain)
		const { pageCallback, pageEnterCallback } = this.task
		const { pages } = options
		const browser = await createBrowser(this.task.proxy)
		this.browser = browser
		let page = await createPage(browser, false)

		await pageSetAddress(url, this, { page, retry: 3 })
		const { page: newPage } = await goto({ parse: this, url, page })
		if (!this.task.isWorking()) return { nextPageUrl: '' }
		page = newPage

		const asins = await getAsinHref(page, this.task)
		// 进入页面后的回调
		pageEnterCallback.call(this.task, { asins, url })
		// this.task.asinList = asins

		// 开始获取数据
		const title = await page.$eval('title', (el: any) => el?.innerText)
		if (title === 'Sorry! Something went wrong!') {
			const { page: newPage } = await goto({ parse: this, url, page })
			if (!this.task.isWorking()) return { nextPageUrl: '' }
			page = newPage
		}

		await this.handlerAsinList({ asins, syncNum: this.task.asyncTagMaxNumber, browser, pages })

		// 执行回调
		pageCallback.call(this.task, { pages, url })

		// 非开始状态
		if (!this.isWorking('单页解析完毕，开始下一页')) return beforeOfferingClose(browser)

		const curPage = getPageIndex(url, this.task.domain)
		let nextPageUrl = await getNextPageUrl(page)

		// max 页数限制
		const { max } = this.task as any
		console.log('current page', curPage, url)

		const nextPage = getPageIndex(nextPageUrl as any, this.task.domain)

		if (!nextPageUrl || curPage >= max) {
			nextPageUrl = ''
			this.task.finish.call(this.task)
			console.log('停止 ->', max, nextPage)
		}

		// tryCatch(() => page.close())
		console.log('下一个 path', nextPageUrl, browser.isConnected())
		delayWait(10 * 1000)
			.then(() => {
				if (browser.isConnected()) tryCatch(() => browser.close())
			})
			.catch(() => {})

		return { nextPageUrl }
	}

	/**
	 * 解析所有页面
	 * @param {string} url url
	 * @param {Task} task task
	 * @param {object} options options
	 * @param {{ index: number }} options.pages options
	 */
	async parseAllPage(url: string, options = {} as Pick<Options, 'pages'>) {
		// 非开始状态
		if (!this.isWorking('解析所有页面')) return
		const { pages = { index: 0, asinIndex: 0 } } = options

		options.pages = pages
		options.pages.index++

		const result = await this.parseSinglePage(url, options)

		// 非开始状态
		if (!this.isWorking('解析所有页面，下一页')) return
		if (result && result.nextPageUrl) await this.parseAllPage(result.nextPageUrl, options)
	}

	/**
	 * 递归获取范围内所有 asin 列表
	 */
	async parseAllAsinList(
		url,
		task: Task,
		options = {} as {
			callback: (...args) => void
			min: number
			max: number
			asins?: Set<string>
			page?: Page
			browser?: Browser
		}
	): Promise<Set<string>> {
		// 非工作状态，暂停执行
		const { callback, min = 1, max = 1, asins = new Set() } = options
		if (!options.asins) options.asins = asins
		if (!task.isWorking()) return options.asins

		let { page, browser } = options
		if (!browser) options.browser = browser = await createBrowser(this.task.proxy)
		if (!page) options.page = page = await createPage(browser)
		this.browser = options.browser

		// 最小页数处理
		const curPage = getPageIndex(url, this.task.domain)
		if (curPage == min || curPage < min) {
			const { url: newUrl, page: newPage } = await this.zombieUrl(url, page)
			url = newUrl
			options.page = page = newPage
		}

		if (curPage < min) {
			url = getSpecifyPage(url, { domain: this.task.domain, index: min })
			return await this.parseAllAsinList(url, task, options)
		}

		const { page: newPage } = await goto({ parse: this, url, page })
		if (!task.isWorking()) return
		page = newPage

		// 只有到第5页，才会显示真正的最后页数
		if (curPage === 5) {
			const { lastNum } = (await getLastPageNum(url, page)) as Data
			// 最大采集页数
			const maxPage = Math.min(lastNum, max)
			if (curPage > maxPage) {
				tryCatch(() => browser.close())
				return options.asins
			}
		}

		// 设置地址
		await entryPageSetAddress(page, this.task, { curPage }).catch((error) => {
			console.log('设置地址失败1', error)
		})

		// 获取 asin 列表并执行回调
		const asinList = (await getAsinHref(page, this.task)) || []
		asinList.map((asin) => asins.add(asin))

		this.task.task.log({
			log: `列表采集中：第 ${curPage} 页，成功, 共发现asin ${asinList.length} 个`,
			status: 'success',
		})

		callback?.call(this.task, {
			total: max - min + 1,
			curIndex: curPage,
			min,
			max,
			asins: Array.from(asinList),
		})

		if (curPage >= max) {
			tryCatch(() => browser.close())
			return options.asins
		}
		const nextUrl = getSpecifyPage(url, { domain: this.task.domain, index: curPage + 1 })
		// 递归获取
		return await this.parseAllAsinList(nextUrl, task, options)
	}

	/**
	 * 判断是否是无库存商品，是的话需要获取无库存商品的地址
	 */
	async zombieUrl(url: string, page: Page): Promise<{ url: string; page: Page }> {
		if (this.task.info.type !== 'zombie') return { page, url }
		this.task.task.log({
			log: '开始获取无库存商品的链接',
			status: 'success',
		})

		const { page: newPage } = await goto({
			url,
			parse: this,
			page,
		})
		page = newPage

		const getHref = (el) => el?.getAttribute('href' || '')
		const href1 = await page.$eval('#filter-p_n_availability a', getHref).catch(() => '')
		const href2 = await page
			.$eval('ul[aria-labelledby=p_n_availability-title] li a', getHref)
			.catch(() => '')
		let newurl = href1 || href2 || ''
		// console.log(href1)
		// console.log(href2)

		if (newurl) newurl = linkComplete(newurl, this.task.domain)

		this.task.task.log({
			log: '[无库存入口链接]',
			url: newurl || url,
			status: 'success',
		})
		return { url: newurl || url, page }
	}

	isTypeAsin(data: TaskAsin | TaskPage): data is TaskAsin {
		return data instanceof TaskAsin
	}
	isTypePage(data: TaskAsin | TaskPage): data is TaskPage {
		return data instanceof TaskPage
	}
}
