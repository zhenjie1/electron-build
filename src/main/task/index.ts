import { TaskPool } from './taskPool'
import { ipcMain } from 'electron'
import './event'
import { TaskInfo } from './type'

export const taskPool = new TaskPool()

ipcMain.on('initTasks', (_, options: { tasks: TaskInfo[]; processNumber: number }) => {
	const { processNumber, tasks } = options
	// 如果没有 working 中的任务，默认执行第一个任务
	if (tasks.length > 0) {
		const workingTask = tasks.find((t) => t.status === 'working')
		if (!workingTask) tasks[0].status = 'working'
	}
	tasks.map((task) => taskPool.createTask({ info: task }))

	if ([undefined, null].includes(processNumber)) taskPool.setProcessNum(processNumber)

	const task = tasks.find((task) => task.status === 'working')
	if (tasks.length && task) {
		taskPool.start(task.id)
	}
})
