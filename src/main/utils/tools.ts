import cheerio from 'cheerio'
import { useIpcRenderApi } from '@main/useIpcRenderApi'
import { HTTPResponse, Page } from 'puppeteer-core'

export const isDev = process.env.NODE_ENV === 'development'

/**
 * 生成指定数量的数组
 */
export const createSpecifyNumberArr = (num: number) => {
	return new Array(num).fill(undefined)
}

type RetryFn = (...args: any[]) => any
/**
 * 将函数重视 n 次
 * @param fn 函数
 * @param n 重试次数
 * @param interval 重试间隔
 */
export async function retry<T extends RetryFn>(
	fn: T,
	n = 10,
	interval = 300
): Promise<ReturnType<T>> {
	const result = await fn()

	if (n <= 0) return result

	if (result) return result
	else {
		const { p, resolve } = createPromise<T>()
		// console.log('准备重试')
		setTimeout(() => {
			retry(fn, --n, interval).then(resolve)
		}, interval)

		return p as any
	}
}

type LastReturn =
	| {
			success: true
			nextPageUrl: string
			prevPageUrl: string
			lastNum: number
	  }
	| {
			success: false
			status: number
	  }
/**
 * 获取页面中，最后一页的页数
 * @param {string} url url
 * @param {string} domain domain
 * @returns {number}
 */
export const getLastPageNum = async (url: string, page?: Page): Promise<LastReturn> => {
	let apiErrorStatus: number

	let res
	if (page) {
		res = await page.content()
	} else {
		res = await useIpcRenderApi('task.getPageDom', { params: [url], type: 'fetch' }).catch(
			(e) => {
				console.error('503 ->', e)
				apiErrorStatus = e.status
				return false
			}
		)
	}

	if (res === false) {
		return {
			success: false,
			status: apiErrorStatus,
		}
	}

	const $ = cheerio.load(res)
	const n1 = $('span.s-pagination-item.s-pagination-disabled').last().text()
	const n2 = $('li.a-last').text()

	const lastNum = parseInt(n1 || n2) || 0

	const prevPageUrl = $('.s-pagination-item.s-pagination-selected')
		.prev('a.s-pagination-item')
		.attr('href')
	const nextPageUrl = $('.s-pagination-item.s-pagination-selected + a.s-pagination-item').attr(
		'href'
	)
	return { lastNum, success: true, nextPageUrl, prevPageUrl }
}

const pageKeys = ['page', 'pg']
/**
 * 获取指定页数的链接地址
 * @param {string} url url
 * @param {object} options options
 * @param {string} options.domain domain
 * @param {number} options.index index
 * @returns {string}
 */
export const getSpecifyPage = (
	url: string,
	{ domain, index }: { domain: string; index: number }
): string => {
	if (!url) {
		console.log('获取指定页数的链接地址失败')
		return ''
	}
	url = linkComplete(url, domain)
	// const key = getPageKey(url, domain)
	const path = new URL(url)
	// if (key) {
	// 	path.searchParams.set(key, index as any)
	// } else {
	pageKeys.map((k) => path.searchParams.set(k, index as any))
	// }
	return path.href
}

/**
 * 获取链接地址中代表页数的 key
 * @param {string} url url
 * @param {string} domain domain
 * @returns {string} key
 */
export function getPageKey(url: string, domain: string) {
	url = linkComplete(url, domain)
	const nextUrl = new URL(url)
	const key = pageKeys.reduce<string>((key, k) => {
		if (key) return key
		if (nextUrl.searchParams.get(k)) return k
		return ''
	}, '')

	if (!key) console.log(`未获取到页面key ${url}`)
	return key
}

/**
 * 获取链接上的页数
 * @param {string} url 链接地址
 * @returns {number}
 */
export const getPageIndex = (url: string, domain: string): number => {
	if (!url) return 1
	url = linkComplete(url, domain)
	const key = getPageKey(url, domain)
	const nextUrl = new URL(url)
	const page = nextUrl.searchParams.get(key) || '1'
	return parseInt(page)
}

/**
 * 链接补全
 * @param {string} url 链接地址
 * @param {string} domain 域名
 * @param {object} params 查询参数
 * @returns {string}
 */
export const linkComplete = (url: string, domain: string, params = {} as Data<string>) => {
	let path = url
	if (url.charAt(0) === '/') path = domain + url
	if (url.charAt(0).toLocaleUpperCase() === 'B') {
		path = `${domain}dp/product/${url}?th=0&psc=1`
	}

	const newUr = new URL(path)
	for (const k in params) newUr.searchParams.set(k, params[k])

	return newUr.href
}

//生成从minNum到maxNum的随机数
export function randomNum(min: number, max: number) {
	return parseInt((Math.random() * (max - min + 1) + min) as any)
}

/**
 * 延迟一定时间
 * @param {number} time 时间 ms
 * @returns {Promise<any>}
 */
export const delayWait = (time = 0, time2?: number) => {
	if (time2) return new Promise((resolve) => setTimeout(resolve, randomNum(time, time2)))

	return new Promise((resolve) => setTimeout(resolve, time))
}

/**
 * try catch
 * @param cb
 */
export const tryCatch = async (cb: Function, isNotice = true) => {
	try {
		await cb()
	} catch (error) {
		if (isNotice) console.trace(error)
	}
}

/**
 * 将字符串转为对象
 * @param {any} data data
 * @returns {object}
 */
export const strToJson = (data: Data) => {
	try {
		return JSON.parse(data as any)
	} catch {
		return data
	}
}

// 获取随机 userAgent
export function getUserAgent() {
	const n1 = Math.round(Math.random() * 10)
	const n2 = Math.round(Math.random() * 100)
	return `Mozilla/5.0 (WindowsNT10.0; Win64;x64) AppleWebKit/537.36 (KHTML, likeGecko) Chrome/98${n1}.0.3497.${n2} Safari/537.36`
}

/**
 * 监听一个网络请求
 */
export const watchPageRequest = async (page: Page, url: string): Promise<HTTPResponse> => {
	// page.setRequestInterception(true)
	page.on('response', responseHandler)

	const { p: promise, resolve, reject } = createPromise()

	const timeout = setTimeout(() => {
		page.off('response', responseHandler)
		reject()
	}, 20 * 1000)
	async function responseHandler(response: HTTPResponse) {
		if (response.url().includes(url)) {
			console.log('监听到了')
			clearTimeout(timeout)
			await page.waitForTimeout(100)
			page.off('response', responseHandler)
			resolve(response)
		}
	}
	return promise
}

/**
 * 检查页面是否存在指定元素
 * 有则返回选择器，没有返回空字符串
 */
export const pageExistKey = async (page: Page, els: string[]): Promise<string | undefined> => {
	const getEl = (select) => page.$(select)
	const i = await Promise.all(els.map(getEl)).then((els) => els.findIndex((el) => !!el))
	if (i === -1) {
		console.error(`未找到指定元素 ${els.toString()}`)
		return undefined
	}

	return els[i]
}

/**
 * 向 input 中输入指定内容
 */
export const pageDownString = async (page: Page, input: string, string: string) => {
	console.log('获取焦点', input)
	await page.focus(input)
	// const elementHandle = await page.$(input)
	// await elementHandle.type(string, { delay: 500 })
	// await elementHandle.press('Enter')

	for (const v of string.split('')) {
		await page.keyboard.down(v as any)
		await delayWait(500)
	}
}

type PageClickElOptions = {
	/**
	 * 是否会发生页面跳转
	 */
	isJump?: boolean
	/**
	 * 如果未找到该元素，等待重试的时间
	 */
	wait?: number
	/**
	 * 一共重试的次数
	 */
	count?: number
	verify?: () => any
}
/**
 * 点击指定元素，会自动判断元素是否存在
 */
export const pageClickEl = async (
	page: Page,
	el: string,
	options = {} as PageClickElOptions
): Promise<boolean> => {
	// eslint-disable-next-line prefer-const
	let { isJump, wait, count, verify } = options
	options.isJump = isJump = options.isJump || false
	options.wait = wait = options.wait || 500
	options.count = count = options.count || 10

	console.log('count', count)
	if (count === 1) {
		console.error('pageClickEl -> 未找到', el, options)
		return false
	}

	const btn = await page.$(el)

	const clickVerify = async () => {
		if (verify) {
			const isVerify = await verify()
			if (!isVerify) {
				await page.waitForTimeout(wait)
				options.count--
				return await pageClickEl(page, el, options)
			} else {
				return true
			}
		} else {
			return true
		}
	}
	if (btn) {
		if (isJump) {
			return Promise.all([
				page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
				page.click(el),
			])
				.then(clickVerify)
				.catch(() => false)
		} else {
			return btn
				.click()
				.then(clickVerify)
				.catch(() => false)
		}
	} else {
		console.log('点击失败，未找到按钮', el)
		return false
	}
}

/**
 * 创建一个空 promise
 */
export const createPromise = <T = any>() => {
	let resolve: (result: T) => any
	let reject
	const p = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { resolve, reject, p }
}
