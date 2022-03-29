import Parse from './parse'
import { getProxyData, ProxyItem } from './proxy'
import { TaskInfo, TaskStatus } from './type'
import Task from './task'
import { mainWindow } from '..'
import { tryCatch } from '@main/utils/tools'
import { isIgnoreCountry } from './ignoreCountry'

type TaskBaseOptions = {
	info: TaskInfo
	useProxy: boolean
	status?: TaskStatus
	task: Task
	activeIndex?: number
}

/**
 * TaskPage 与 TaskAsin 都继承与 TaskBase 类
 */
class TaskBase {
	/**
	 * 任务唯一标识
	 */
	id: number = parseInt((Math.random() * 1000000) as any)
	/**
	 * info.market_site.site_domain
	 */
	domain: string
	/**
	 * 任务信息
	 */
	info: TaskInfo
	/**
	 * 同时开启的 tab 数量
	 */
	asyncTagMaxNumber = 1
	/**
	 * 解析页面的类
	 */
	parse: Parse
	/**
	 * 任务状态
	 */
	status: TaskStatus
	/**
	 * 代理
	 */
	proxy?: ProxyItem
	/**
	 * 该任务是否使用代理
	 */
	useProxy: boolean

	/**
	 * 统计已采集数量
	 */
	total: {
		asins: string[] // asin 总数
		count: number // 当前已采集几条
	}
	task: Task
	/**
	 * 是否获取所属国
	 */
	isCountry: boolean
	/**
	 * 采集类型是否是 asin 采集
	 */
	isTypeAsin: boolean
	/**
	 * 超时时间
	 */
	timeout = 20 * 1000
	/**
	 * goto 失败时的重试次数
	 */
	retryCount = 3

	constructor(options: TaskBaseOptions) {
		this.task = options.task
		this.status = options.status || 'nothing'
		this.useProxy = options.useProxy

		this.total = {
			asins: [],
			count: options.activeIndex || 0,
		}

		/**
		 * @type {object}
		 */
		this.info = options.info || ({} as TaskInfo)
		this.domain = this.info.market_site.site_domain
		this.isTypeAsin = this.info.mold === 3
		/**
		 * 用户勾选所属国 或 采集方式是 asin 采集
		 */
		this.isCountry = this.info.filters.country_site === 'Y' || this.info.mold === 3

		/**
		 * @type {Parse}
		 */
		this.parse = new Parse({ task: this as any })

		/**
		 * this.useProxy = true 时，在执行 this.run 方法时会将获取到的代理ip赋值到此
		 */
		this.proxy = undefined
	}

	/**
	 * 执行 run 方法之前会执行这里
	 * 可做一些前置设置
	 */
	async _run() {
		// 设置代理
		await this.setNewProxy()
	}

	setStatus(status: TaskStatus) {
		this.status = status
		this.parse.task.status = status
	}

	/**
	 * 是否是工作中状态
	 */
	isWorking() {
		return this.status === 'working'
	}

	// 进入页面后执行
	pageEnterCallback(options: Data) {
		const { asins } = options
		this.total.asins = this.total.asins.concat(asins)
		console.log('进入页面了', 'asin.length ->', asins.length)
	}

	// 执行完一页时的回调
	pageCallback(options: Data) {
		const { pages, url } = options
		console.log('执行一页回调', url)
	}

	// 执行完某页中某个 asin 时的回调
	asinCallback(options: Data) {
		const { url } = options
		this.total.count++

		this.task.totalUpdate(options)
		console.log('执行单个回调', url)
	}
	// 完成后的回调
	finish() {
		this.task.resultCount = 0
		console.log('finish 回调')
		// tryCatch(() => this.parse.browser.close(), false)
	}

	/**
	 * 页面 503 后的回调
	 * @param {boolean} taskPause 任务是否暂停
	 */
	page503(taskPause: boolean) {
		if (taskPause) mainWindow.webContents.send('page503')
		console.log('页面 503 的回调, 是否提示用户：', taskPause, '采集个数', this.task.resultCount)
	}

	/**
	 * 获取代理
	 */
	async setNewProxy() {
		if (this.useProxy) {
			const useProxyCountry = isIgnoreCountry(this.info)
			if (useProxyCountry) {
				this.task.log({
					log: '此国家不使用代理',
					status: 'success',
				})
			} else {
				this.task.log({
					log: '获取代理ip中',
					status: 'success',
				})
				const proxys = await getProxyData(1)
				this.task.log({
					log: '获取代理ip成功',
					status: 'success',
				})
				this.proxy = proxys[0]
				return this.proxy
			}
		}
	}

	/**
	 * 销毁任务
	 */
	destory(changeStatus = true) {
		console.trace('task destory')
		// 关闭浏览器
		if (this.parse.browser) {
			tryCatch(() => this.parse.browser.close())
		}

		// 删除任务
		const index = this.task.tasks.findIndex((task) => task.id === this.id)

		if (index !== -1 && changeStatus) {
			this.task.setStatus('paused', false)
			this.task.tasks.splice(index, 1)
		}
	}
}

/**
 * asin 采集
 */
export class TaskAsin extends TaskBase {
	/**
	 * asin 采集时的 asin 列表
	 */
	asinList: string[]
	constructor(options: TaskAsinOptions) {
		super(options)
		this.asinList = options.asinList || []
	}

	async run() {
		await this._run()
		console.log('开始解析了', this.asinList)
		await this.parse.handlerAsinList({
			asins: this.asinList,
			syncNum: this.asyncTagMaxNumber,
		})

		await this.finish()
	}

	/**
	 * 本地ip被封，将任务转移到 代理ip 执行
	 */
	async taskTranslate() {
		const asins = this.asinList.slice(this.total.count)
		this.destory(false)

		const task = this.task.createSingleTask({
			type: 'asin',
			useProxy: true, // 应用代理ip
			asins,
		})
		console.log(
			'任务转移到 代理ip',
			`${asins.length} / ${this.asinList.length}`,
			`tasks length: ${this.task.tasks.length}`
		)
		/**
		 * 启动任务
		 */
		task.run()
	}
}

/**
 * 页数采集
 */
export class TaskPage extends TaskBase {
	min: number
	max: number
	/**
	 * page 采集时的 url 开始地址
	 */
	url: string
	constructor(options: TaskPageOptions) {
		super(options)

		this.min = options.min
		this.max = options.max
		this.url = options.url
	}
	async run() {
		console.log('准备执行 _run')
		await this._run()
		console.log('执行结束 _run')
		if (!this.url) return console.log('请检查 url')
		console.log('开始解析')
		await this.parse.parseAllPage(this.url)
		console.log('finish 下一步')
		await this.finish()
	}

	/**
	 * 本地ip被封，将任务转移到 代理ip 执行
	 */
	async taskTranslate() {
		console.error('task page transTranslate')
		// this.task.createSingleTask({
		// 	useProxy: true,
		// 	url: this.url,
		// 	min: this.min,
		// 	max: this.max,
		// 	status: 'working',
		// })
	}
}

type TaskAsinOptions = TaskBaseOptions & {
	asinList: string[]
}
type TaskPageOptions = TaskBaseOptions & {
	min: number
	max: number
	url: string
}
