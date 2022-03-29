import Task from './task'
import { TaskInfo } from './type'
import { useIpcRenderApi } from '../useIpcRenderApi'
import { mainWindow } from '..'

export class TaskPool {
	tasks: Task[]
	constructor() {
		this.tasks = []
	}

	/**
	 * 开启任务，具体是否开启有内部决定
	 */
	async start(id: number) {
		// 有任务正在运行
		if (this.isStartTask(id)) return console.log('有任务正在运行，无法开启')

		// 可以开启
		const task = this.findTask(id)
		if (!task) return console.log('无法开启，未找到任务', task)
		task.setStatus('working', false)
		// task.tasks.map((t) => t.setStatus('working'))

		console.log('开启任务', id)
		await task
			.run()
			.then(async () => {
				console.log('任务完成', id)
				await task.setStatus('finish')
			})
			.catch(async (error) => {
				console.error(error)
				if (task.status !== 'finish') {
					console.log('任务暂停', id)
					await task.setStatus('paused')
					task.log({
						log: '任务暂停',
						status: 'error',
					})
				}
				task.tasks.map((t) => t.destory())
				// throw new Error(error)
			})

		mainWindow?.webContents.send('reload')
		// 任务结束
		this.runNextTask()
	}

	/**
	 * 查找下一个可执行任务
	 */
	async runNextTask() {
		console.log(
			'run next status',
			this.tasks.map((v) => v.status)
		)
		const task = this.tasks.find((task) => task.status === 'pending')
		console.log('查找下一个可执行任务', task?.info.id, task?.status)
		if (!task) return console.log('所有任务执行完毕')

		task.setStatus('working')
		this.start(task.info.id)
	}

	/**
	 * 创建任务并添加到 this.tasks 中
	 */
	createTask(options: { info: TaskInfo }): Task {
		const { info } = options
		if (!info) throw new Error('创建任务失败')

		let task = this.findTask(info.id)
		if (task) {
			// task.setStatus(info.status)
		} else {
			console.log('创建任务', info.id)
			task = new Task({ info })
			this.tasks.push(task)
		}

		return task
	}

	/**
	 * 设置可开启的 win 数量
	 */
	setProcessNum(num: number) {
		this.tasks.map((task) => {
			task.asyncWinMaxNumber = num
		})
	}

	/**
	 * 指定任务是否在运行
	 */
	isStartTask(id: number): boolean {
		return !!this.tasks.filter((v) => v.info.id !== id).find((v) => v.status === 'working')
	}

	/**
	 * 是否有任务在运行
	 */
	isWorking(): boolean {
		return !!this.tasks.find((v) => v.status === 'working')
	}

	/**
	 * 查找指定 task
	 */
	findTask(id: number): Task | undefined {
		return this.tasks.find((v) => v.info.id === id)
	}
}
