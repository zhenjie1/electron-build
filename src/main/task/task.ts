import { TaskAsin, TaskPage } from './taskChild'
import dayjs from 'dayjs'
import { createSpecifyNumberArr, linkComplete, tryCatch } from '@main/utils/tools'
import { TaskInfo, TaskStatus } from './type'
import { ProxyItem } from './proxy'
import { mainWindow } from '..'
import { useIpcRenderApi } from '@main/useIpcRenderApi'
import { urlPickAsin } from '@main/utils/parsePage'

type Params = {
	asinList?: string[]
	info: TaskInfo
}

type CreateSingleOptions = { useProxy: boolean } & (
	| { type: 'asin'; asins: string[] }
	| { type: 'page'; url: string; min: number; max: number; status: TaskStatus }
)
export default class Task {
	url: string
	info: TaskInfo
	domain: string
	asinList: string[]
	tasks: (TaskAsin | TaskPage)[]
	asyncWinMaxNumber: number
	status: TaskStatus
	proxys: ProxyItem[]
	isTypeAsin: boolean
	// taskPageList: TaskPageList = new TaskPageList(this)
	/**
	 * 获取商品列表 href 的任务
	 */
	taskGoodsHref: TaskPage

	/**
	 * 当前已采集数量
	 */
	resultCount: number

	constructor(params: Params) {
		const { info, asinList } = params
		this.url = ''
		/**
		 * @type {object}
		 */
		this.info = info
		this.domain = this.info.market_site.site_domain
		this.isTypeAsin = this.info.mold === 3

		this.asinList = asinList || []

		/**
		 * @type {(TaskAsin | TaskPage)[]}
		 */
		this.tasks = []

		/**
		 * @type {number} 同时开启 browser 的最大数
		 * 此数量包含启动的本地 ip
		 */
		this.asyncWinMaxNumber = 1

		/**
		 * task status
		 */
		this.status = info.status || 'nothing'

		this.proxys = []

		// this.resultFirst
		this.resultCount = 0
	}

	/**
	 * 开启任务
	 */
	async run() {
		this.resultCount = 0
		this.getTaskUrl()
		this.log({
			log: '开启任务',
			status: 'success',
		})
		console.log('url ->', this.url)
		this.asinList = await this.pageToAsinList()
		if (!this.isWorking()) return
		await this.createTaskChild()

		return Promise.all(this.tasks.map((task) => task.run())).then(() => {
			this.finish()
		})
	}

	// 将页面转为 asinList
	async pageToAsinList(): Promise<string[]> {
		let asinList = []
		if (!this.isTypeAsin) {
			const [min, max] = this.info.filters.pages
			this.log({
				log: `从指定页数中获取所有 asin, 页数[${min}, ${max}]`,
				status: 'success',
			})
			let task = this.createSingleTask({
				type: 'page',
				url: this.url,
				useProxy: true,
				status: 'working',
				min: parseInt(min),
				max: parseInt(max),
			})
			this.taskGoodsHref = task as TaskPage
			await task.setNewProxy()
			if (!this.isWorking()) return []

			this.log({
				log: '[入口链接]',
				url: this.url,
				status: 'success',
			})
			const asinsSet = await task.parse
				.parseAllAsinList(this.url, task, {
					min: parseInt(min),
					max: parseInt(max),
					callback: this.pageProgress,
				})
				.catch((error) => {
					this.log({
						log: '读取页面商品失败',
						status: 'error',
					})
					throw error
				})
			const asins = Array.from(asinsSet)
			const asinObject = asins.reduce((data, asinUrl) => {
				const asin = urlPickAsin(asinUrl)
				if (asin) data[asin] = asinUrl
				else data[Math.random()] = asinUrl
				return data
			}, {} as Data<string>)
			const removeRepeatAsins = Object.values(asinObject)
			this.log({
				log: `共检测到商品 ${asins.length} 个，去除重复后剩余 ${removeRepeatAsins.length}，开始逐个解析商品`,
				status: 'success',
			})
			task = null
			mainWindow.webContents.send('totalAsinLength', removeRepeatAsins)
			asinList = removeRepeatAsins
		} else {
			asinList = this.info.asins_array || []
		}

		// if (asinList)
		return asinList
	}

	finish() {
		this.log({
			log: '所有数据解析完毕！',
			status: 'success',
		})
	}

	// 页面转asin的进度回调
	pageProgress(page) {
		mainWindow?.webContents.send('pageProgress', { ...page, info: this.info })
	}

	// 获取完一个 asin 时，进度回调
	totalUpdate(options: Data) {
		const { url, asin } = options
		this.resultCount++

		mainWindow?.webContents.send('progress', {
			currentCount: this.resultCount,
			info: this.info,
			total: this.asinList.length,
		})
	}

	/**
	 * 记录日志
	 */
	log(params: { log: string; url?: string; status: 'success' | 'error' }) {
		const { url, status } = params
		let { log: content } = params

		const timeNow = dayjs().format('MM-DD HH:mm:ss')
		content = `${timeNow}：${content}`
		mainWindow.webContents.send('task:log', {
			info: this.info,
			log: content,
			url,
			status,
		})
	}

	changeInfo(info: TaskInfo) {
		this.info = info
		this.tasks.map((task) => (task.info = info))
	}

	/**
	 * 创建子任务
	 */
	async createTaskChild() {
		const { asyncWinMaxNumber, asinList, info } = this
		this.tasks = []
		const isTypeAsin = info.mold === 3
		const [startNum, max] = info.filters.pages.map((v) => parseInt(v))
		const createTaskChild = (asins: string[], useProxy: boolean) => {
			const taskChild = new TaskAsin({
				useProxy: useProxy,
				info,
				task: this,
				asinList: asins,
				status: this.status,
			})
			this.tasks.push(taskChild)
		}

		/**
		 * asin 采集
		 */
		if (asinList.length > asyncWinMaxNumber * 5) {
			const singleNum = Math.ceil(asinList.length / asyncWinMaxNumber)
			createSpecifyNumberArr(asyncWinMaxNumber).map((_: any, i: number) => {
				const asins = asinList.slice(i * singleNum, (i + 1) * singleNum)
				createTaskChild(asins, i !== 0) // 第一个任务用不走代理，其他的走代理
			})
		} else {
			// 只开启一个任务，无需代理
			createTaskChild(asinList, false)
		}
	}

	createSingleTask(options: CreateSingleOptions): TaskAsin | TaskPage {
		const { asins, min, max, useProxy, type } = options as Data
		const { info, status, url } = this

		let task: TaskAsin | TaskPage
		if (type === 'asin') {
			task = new TaskAsin({
				useProxy,
				info,
				task: this,
				asinList: asins,
				status,
			})
			this.tasks.push(task)
		} else {
			task = new TaskPage({
				useProxy,
				url,
				min,
				max,
				status,
				info,
				task: this,
			})
			this.tasks.push(task)
		}
		return task
	}

	/**
	 * 当采集方式为 关键词、店铺、分类 时，通过设置 url 来启动任务
	 */
	getTaskUrl() {
		const { mold, collect_url, keyword, attrs } = this.info
		const { model } = attrs || ({} as Data)

		// 关键词采集
		if (mold === 0) {
			// 选择了分类
			if (model && model.length > 0) {
				this.url = linkComplete(model.at(-1) as any, this.domain)
			} else {
				// 没有选择分类
				const kw = keyword.replace(/\s+/g, '+')
				const url = new URL(`${this.domain}s?k=${kw}`)
				this.url = url.href
			}
		} else if ([1, 2].includes(mold)) {
			// 店铺采集与分类采集
			this.url = collect_url
		} else if (mold === 3) {
			// asin 采集
			this.url = ''
			this.asinList = this.info.asins_array || []
		}
	}

	/**
	 * 设置任务状态
	 */
	async setStatus(status: TaskStatus, isSend = true) {
		console.log('修改任务状态', status)
		this.status = status
		this.tasks.map((task) => task.setStatus(status))
		if (this.taskGoodsHref) this.taskGoodsHref.setStatus(status)
		const data = {
			nothing: '未开始',
			working: '开始采集',
			paused: '暂停',
			pending: '排队中',
			finish: '完成',
			suspended: '暂停',
		}

		if (isSend) {
			this.log({
				log: '修改任务状态：' + data[status],
				status: 'success',
			})
			await useIpcRenderApi('home.changeStatus', { params: [{ id: this.info.id, status }] })
		}

		// 是否是开启任务
		const isStart = ['working', 'pending'].includes(status)
		// 暂停后关闭浏览器
		if (!isStart) {
			setTimeout(() => {
				this.tasks.map((task) => {
					tryCatch(() => {
						task.parse.browser.close()
					})
				})
			}, 1000)
		}
	}

	/**
	 * 是否是工作中状态
	 */
	async isWorking() {
		return this.status === 'working'
	}
}
