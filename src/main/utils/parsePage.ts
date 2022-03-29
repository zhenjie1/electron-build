import { linkComplete, createPromise, tryCatch } from './tools'
import { mainStore, setStore } from './store'
const puppeteer = require('puppeteer-core')
import { TaskAsin, TaskPage } from '@main/task/taskChild'
import { Browser, Page } from 'puppeteer-core'
import cheerio, { CheerioAPI } from 'cheerio'
import { proxyDisabled, ProxyItem } from '@main/task/proxy'
import { ipcMain } from 'electron'
import Parse from '@main/task/parse'
type Task = TaskAsin | TaskPage
const findChrome = require('carlo/lib/find_chrome')

/**
 * 任务相关的设置
 */
export const setter: Data = mainStore.get('setter', {}) || {}

ipcMain.on('setter', (_, data: Data) => {
	for (const i in data) setter[i] = data[i]
	setter.chrome = setter.chrome.replace(/\\/g, '\\\\')
	if (setter.chrome && !/(chrome\.exe)$/i.test(setter.chrome)) {
		// 字母结尾
		if (/\\$/i.test(setter.chrome)) {
			setter.chrome = setter.chrome + 'chrome.exe'
		} else {
			setter.chrome = setter.chrome + '\\chrome.exe'
		}
	}
	setStore('setter', setter)
})
ipcMain.on('globalConfig', (_, data = {} as Data) => {
	for (const i in data) setter[i] = data[i]
})

/**
 * 创建一个 browser
 */
export async function createBrowser(proxy?: ProxyItem): Promise<Browser> {
	const args: string[] = ['--auto-open-devtools-for-tabs']
	if (proxy) {
		args.push(`--proxy-server=http://${proxy.ip}:${proxy.port}`)
	}

	if (!setter.chrome) {
		const winChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
		const findChromePath = await findChrome({})
		const executablePath = findChromePath.executablePath
		setter.chrome = executablePath || winChromePath
		setStore('setter.chrome', setter.chrome)
	}

	return await puppeteer.launch({
		executablePath: setter.chrome,
		headless: !setter.debug,
		args,
	})
}

/**
 * 创建一个页面
 * @param {puppeteer.Browser} browser browser
 * @param {boolean} isIntercept 是否拦截
 * @returns {puppeteer.Page} 返回页面对象
 */
export async function createPage(browser: Browser, isIntercept = true): Promise<Page> {
	const page = await browser.newPage()
	page.authenticate({
		username: 'xr6d72',
		password: 'kizunxr4',
	})

	page.setRequestInterception(true)
	page.on('request', (request) => {
		const keys = ['image', 'stylesheet', 'font', 'script']

		if (setter.debug) {
			keys.splice(1, 1)
		}
		if (keys.includes(request.resourceType())) request.abort()
		else request.continue()
	})

	return page
}

type GotoOptions = {
	parse: Parse
	page: Page
	url: string
	options?: Parameters<Page['goto']>[1] & {
		retryCount?: number // 重试次数
	}
}

/**
 * 进入页面，只有成功，没有失败
 */
export async function goto(params: GotoOptions): Promise<{ page: Page }> {
	const { page, url, parse, options = {} } = params
	const task = parse.task
	if (!task.isWorking()) return { page }

	options.retryCount = options.retryCount || task.retryCount
	params.options = options
	options.timeout = task.timeout
	params.options.retryCount--

	if (!options.waitUntil) options.waitUntil = 'domcontentloaded'

	if (options.retryCount === 0) {
		tryCatch(() => parse.browser.close())
		console.log('retry end, prepare to replace proxy', task.proxy)
		if (task.proxy) {
			console.log('before use proxy', `${task.proxy.ip}:${task.proxy.port}`)
			await proxyDisabled(task.proxy)
		}

		console.log('get new proxy')
		task.useProxy = true
		await task.setNewProxy()
		console.log('create new browser, user proxy', `${task.proxy.ip}:${task.proxy.port}`)
		parse.browser = await createBrowser(task.proxy)
		const page = await createPage(parse.browser)
		params.options.retryCount = task.retryCount
		return goto({ ...params, page, options })
	} else {
		const { p, resolve, reject } = createPromise<{ page: Page }>()

		page.goto(url, options)
			.then(() => resolve({ page }))
			.catch(reject)
		setTimeout(() => reject(new Error('TimeoutError')), options.timeout)

		return p
			.then(async () => {
				const title = await page.title()
				// eslint-disable-next-line quotes
				const page503_1 = await page.$("form[action='/errors/validateCaptcha']")
				const page503_2 = title.includes('Something Went Wrong')
				const page503_3 = title.includes('Toutes nos excuses')
				const page503_4 = title.includes('503')
				const page503 = page503_1 || page503_2 || page503_3 // || page503_4

				console.log(
					'page503_1',
					!!page503_1,
					'page503_2',
					!!page503_2,
					'page503_3',
					!!page503_3,
					'page503_4',
					!!page503_4
				)
				if (page503) {
					reject(new Error('PAGE503'))
					throw new Error(`page 503 url -> ${url}`)
				}
				return { page }
			})
			.catch((error) => {
				console.error('entry page fail ->', error)
				console.log('start try retry', params.options.retryCount)
				// 不管因何种原因报错，直接进入重试
				return goto(params)
			})
	}
	// }
}

type CodeCityVal = {
	locationType?: string
	city?: string
	cityName?: string
	countryCode?: string
	customCode?: string // 自定义的 code
	storeContext?: string
	deviceType?: string
	district?: string
	pageType?: string
	actionSource?: string
	almBrandId?: string
	zipCode?: string
}

const zipCodes: { [key: string]: string | CodeCityVal } = {
	// 阿联酋
	AR: {
		locationType: 'CITY',
		city: 'Dubai',
		cityName: 'Dubai',
		storeContext: 'generic',
		pageType: 'Gateway',
	},
	// 荷兰
	NL: {
		locationType: 'COUNTRY',
		countryCode: 'BE',
		customCode: 'Belgium',
		storeContext: 'generic',
		pageType: 'Gateway',
	},
	// 沙特
	SA: {
		locationType: 'CITY',
		city: 'Riyadh',
		district: 'undefined',
		countryCode: 'undefined',
		cityName: 'Riyadh',
		storeContext: 'generic',
		pageType: 'Gateway',
	},
	// 澳大利亚
	AU: {
		locationType: 'POSTAL_CODE_WITH_CITY',
		zipCode: '2023',
		city: 'BELLEVUE HILL',
		customCode: '2023',
	},
	GB: {
		zipCode: 'NW16XE',
		customCode: 'NW1 6',
	}, // 英国 备用: 1. CB2 1TN 2. OX1 2JD 3. WC1E 7HU
	CA: {
		zipCode: 'T0A 0A0',
		customCode: 'T0A 0A',
	}, // 加拿大
	BR: '69945-000', // 巴西
	MX: '01010', // 墨西哥
	US: '10010', // 美国
	DE: '93326', // 德国
	ES: '04691', // 西班牙
	FR: '01500', // 法国
	IT: '66040', // 意大利
	SG: '018925', // 新加坡
	JP: {
		zipCode: '490-1431',
	}, // 日本
	SE: '314 20', // 瑞典
	PL: {
		zipCode: '86-300',
		customCode: '86300',
	}, // 波兰
	IN: '515004', // 印度
}

/**
 * 进入页面设置地址
 */
export async function entryPageSetAddress(page: Page, task: Task, options: { curPage: number }) {
	const { info } = task
	const { curPage } = options

	// 页面上显示的 code
	const pageCode: string = await page.evaluate(() => {
		const curZipCode = document
			.querySelector<any>('#nav-belt #glow-ingress-line2')
			?.innerText?.toLocaleLowerCase()
		return curZipCode || ''
	})
	let zipCode = zipCodes[info.market_site.country_code]
	zipCode = typeof zipCode === 'string' ? { zipCode } : zipCode
	const code = (zipCode.customCode || zipCode.zipCode || zipCode.city).toLocaleLowerCase()

	console.log('是否需要设置地址', !pageCode.includes(code), pageCode, code)
	// 无需设置地址
	if (pageCode.includes(code)) return

	// 需要设置地址
	return addressDetectionClick(page, task).then(async () => {
		return page.reload({ waitUntil: 'domcontentloaded', timeout: 60 * 1000 })
	})
}

/**
 * 发送请求设置地址
 */
export async function addressDetectionClick(
	page: Page,
	task: Task,
	options = {} as { retry?: number; timeout?: number }
): Promise<any> {
	// console.log('设置地址开始')
	// 默认值设置
	const { retry = 0, timeout = 30 * 1000 } = options
	options.retry = retry
	options.timeout = timeout

	const { p, resolve, reject } = createPromise<void>()
	// 超时处理
	setTimeout(() => reject(), timeout)

	// 失败处理
	p.catch((error) => {
		// 重试次数用完，抛出异常
		if (!options.retry || options.retry <= 0) throw error
		// 开始重试
		--options.retry
		console.log('设置地址重试', options.retry)
		return addressDetectionClick(page, task, options)
	})

	const isSuccess = await page.evaluate(
		([info, zipCodes]) => {
			const el1 = document.querySelector('#nav-global-location-data-modal-action')
			const modalStr = el1?.getAttribute('data-a-modal')
			const modal = modalStr ? JSON.parse(modalStr) : ''
			if (typeof modal !== 'object') return false

			return fetch(modal.url, {
				method: 'get',
				headers: {
					'anti-csrftoken-a2z': modal.ajaxHeaders['anti-csrftoken-a2z'],
				},
			})
				.then(async (res) => {
					const result = await res.text()
					let token: any = /CSRF_TOKEN\s:\s"([^"]+)/.exec(result)
					if (!token) throw new Error('无法设置地址')

					token = token[1]
					console.log('token', token)
					return token
				})
				.then((token) => {
					const url = location.origin + '/gp/delivery/ajax/address-change.html'
					const body = new FormData()
					const code = info.market_site.country_code
					const val = zipCodes[code]
					const countryCode = typeof val === 'string' ? { zipCode: val } : val
					delete countryCode.customCode

					const data = {
						locationType: 'LOCATION_INPUT',
						district: info.market_site.country_code,
						countryCode: info.market_site.country_code,
						storeContext: 'apparel',
						deviceType: 'web',
						pageType: 'Detail',
						actionSource: 'glow',
					}
					localStorage.setItem('data', JSON.stringify(data))
					for (const i in countryCode) {
						data[i] = countryCode[i] === 'undefined' ? undefined : countryCode[i]
					}
					localStorage.setItem('data2', JSON.stringify(data))
					localStorage.setItem('countryCode', JSON.stringify(countryCode))
					localStorage.setItem('testAddress', JSON.stringify(data))
					for (const i in data) if (data[i] !== undefined) body.append(i, data[i])
					const options = {
						body,
						method: 'post',
						headers: { 'anti-csrftoken-a2z': token },
					}
					return fetch(url, options)
				})
				.then(() => true)
				.catch(() => false)
		},
		[task.info, zipCodes]
	)
	isSuccess ? resolve() : reject()

	return p
}

/**
 * 给页面设置地址
 */
export async function pageSetAddress(
	url: string,
	parse: Parse,
	options: { page: Page; retry: number }
) {
	const { p, reject, resolve } = createPromise<{ page }>()
	const { page } = options
	const task = parse.task

	url = linkComplete(url, task.domain)
	console.log('开始设置地址 ->', url)
	const { page: newPage } = await goto({ parse: parse, url, page })
	options.page = newPage

	if (!parse.task.isWorking()) return

	addressDetectionClick(page, task)
		.then(() => {
			console.log('设置地址成功')
			resolve({ page: options.page })
		})
		// 重试结束还是未成功
		.catch((error) => {
			console.error('设置地址失败', error)
			reject(error)
		})

	return p
}

/**
 * 获取页面内的 asin href
 * @param {puppeteer.Page} page Page
 * @param {Task} task task
 * @returns {string[]}
 */
export async function getAsinHref(page: Page, task: Task): Promise<string[]> {
	const html = await page.content()
	const $ = cheerio.load(html)
	const result = $('.s-result-item[data-asin^=B]')
		.toArray()
		.map((v) => $(v).find('.s-product-image-container a').attr('href'))

	const newResult = result
		.filter((v) => !!v)
		.map((link) => linkComplete(link as string, task.domain))
	return newResult
}

/**
 * 返回下一页的链接地址， 没有则返回 ''
 */
function getPageUrl($: CheerioAPI, type: 'next' | 'current', url: string): string | undefined {
	const p1 = $('.s-pagination-strip .s-pagination-selected')
	if (p1.length) {
		if (type === 'current') return url
		if (type === 'next') return p1.next('a.s-pagination-item.s-pagination-button').attr('href')
	}

	return undefined
}

/**
 * 获取页面内的 asin href
 * @param {puppeteer.Page} page Page
 * @returns {string}
 */
export async function getNextPageUrl(page: Page) {
	const domHtml = await page.content()
	const $ = cheerio.load(domHtml)
	const nextPage = getPageUrl($, 'next', '')
	return nextPage
}

/**
 * 从 url 中提取 asin
 */
export function urlPickAsin(url: string): string | undefined {
	if (!url) return

	const decodeUrl = decodeURIComponent(url)
	if (decodeUrl.includes('/dp/')) {
		if (decodeUrl.includes('dp/product')) {
			return decodeUrl.replace(/.+\/dp\/product\/(\w+).+/, '$1')
		} else {
			return decodeUrl.replace(/.+\/dp\/(\w+).+/g, '$1')
		}
	}
}
