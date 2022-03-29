import { useIpcRenderApi } from '../useIpcRenderApi'
import { ipcMain } from 'electron'
import { taskPool } from '.'
import { TaskInfo, TaskStatus } from './type'

ipcMain.on('socketEvent', (e, data) => {
	const { event } = data

	const handler: Data = {
		zombie: taskHandler,
	}

	// handler[event]?.(data)
	// console.log('来自 socket', typeof data)
})

type ChangeStatusOptions = {
	info: TaskInfo
	status: TaskStatus
	processNumber: number
	type?: 'getStatus'
}

function start(data: ChangeStatusOptions) {
	const { info, status, processNumber } = data

	// 此任务是否正在运行
	const isWorking = taskPool.isWorking()
	let task = taskPool.findTask(info.id)
	// 用户目的，是否开启任务
	const isStart = ['working', 'pending'].includes(status)

	const workingTask = taskPool.tasks.filter((v) => ['working', 'pending'].includes(v.status))
	if (isStart && workingTask.length >= 5) return { status: 'nothing' }

	// 第一步，创建任务
	if (!task) task = taskPool.createTask({ info })
	// 设置最大 win 数
	if (![undefined, null].includes(processNumber)) task.asyncWinMaxNumber = processNumber
	// 修改 info
	task.changeInfo(info)

	// 第二步，是否开启任务
	// 有任务在运行
	if (isWorking) {
		const isSelf = taskPool.tasks.find((v) => v.status === 'working' && v.info.id === info.id)

		// 是不是本任务
		if (isSelf) {
			if (isStart) {
				console.log('无需开启')
				return task
			} else {
				// 关闭正在运行的任务
				task.setStatus(status)
				// 查找下一个任务
				taskPool.runNextTask()
			}
		} else {
			// 不是本任务，说明其他任务在运行
			if (isStart) task.setStatus('pending')
			else task.setStatus(status)
		}
	} else {
		// 没有任务在运行
		//  是否开启
		if (isStart) {
			task.setStatus('working')
			taskPool.start(info.id)
		} else {
			task.setStatus(status)
		}
	}

	return task
}

// 修改任务状态
ipcMain.handle('changeStatus', (e, data: ChangeStatusOptions) => {
	const task = start({ ...data, type: 'getStatus' })
	return task.status
})

/**
 * 收到 socket 事件
 */
function taskHandler(params: any) {
	const {
		data: { task: taskInfo },
	} = params
	const info: TaskInfo = taskInfo

	let task = taskPool.findTask(info.id)
	if (!task) {
		task = taskPool.createTask({ info })
	}

	// task.setStatus(info.status)
	// task.status = info.status
	// console.log('来自页面的事件', task.status)

	// if (info.status === 'working') {
	// 	taskPool.start(info.id)
	// }
}
