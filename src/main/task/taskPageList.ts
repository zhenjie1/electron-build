import { number } from '@intlify/core-base'
import { createSpecifyNumberArr, getLastPageNum } from '@main/utils/tools'
import { mainWindow } from '..'
import Task from './task'

export default class TaskPageList {
	task: Task

	constructor(task: Task) {
		this.task = task
	}

	async startGetAsinList() {
		const { url, asyncWinMaxNumber } = this.task
		const lastPage = await getLastPageNum(url)
		if (lastPage.success === false) {
			mainWindow.webContents.send('message', {
				msg: '您的 ip 已被封',
				type: 'localIpDisabled',
			})
			return
		}

		const [startNum = 1, max = 1] = this.task.info.filters.pages.map((v) => parseInt(v))
		const { nextPageUrl = '', prevPageUrl = '', lastNum = 1 } = lastPage
		// 用户输入的最大页数与页面最大数取最小值
		const maxPage = Math.min(max, lastNum)
		// 一共采多少页
		const calc = maxPage - startNum + 1
		// 可开启的最大浏览器数量
		const maxWin = Math.min(asyncWinMaxNumber, calc)
		// 每个浏览器应该采集多少页
		const itemLen = Math.ceil(calc / maxWin)

		console.log('maxWin', maxWin, 'maxPage', maxPage, 'startNum', startNum)
		if (maxWin <= 0) return
		createSpecifyNumberArr(maxWin).map((_: any, i: number) => {
			const start = startNum + i * itemLen
			const end = Math.min(start + itemLen - 1, max)
			console.log(start, end)
		})
	}
}
