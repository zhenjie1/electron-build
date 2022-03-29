import { useAxios } from './fetch'

export const list = (data: Data = {}, page = 1, limit = 20) =>
	useAxios<Data>({
		url: '/amazon/zombie/task/index',
		method: 'get',
		data: {
			...data,
			page,
			limit,
		},
		defaultValue: {},
		dataPath: 'data.list',
	})

export const changeStatus = () =>
	useAxios({
		url: '/amazon/zombie/task/status',
		method: 'get',
	})

// 获取分类
export const getCategories = () =>
	useAxios({
		url: '/amazon/categories',
		method: 'get',
		defaultValue: [],
	})

// 创建任务
export const createTask = () =>
	useAxios({
		url: '/amazon/zombie/task/edit',
	})

// 删除任务
export const removeTask = () =>
	useAxios({
		url: '/amazon/zombie/task/del',
		method: 'get',
	})
