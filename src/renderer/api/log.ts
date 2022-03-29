import { useAxios } from './fetch'

export const list = () =>
	useAxios({
		url: '/amazon/zombie/logs',
		method: 'get',
		defaultValue: [],
		dataPath: 'data.data',
	})

export const clear = () =>
	useAxios({
		url: '/amazon/zombie/logs-clear',
		dataPath: 'data.data',
	})
