const axios = require('axios-https-proxy-fix')
import { pick } from 'lodash'
import { mainWindow } from '..'
import { useIpcRenderApi } from '../useIpcRenderApi'

export type ProxyItem = {
	beforeTime: number
	usageTime: number
	id: number
	ip: string
	port: string
	ttl: number
	status: 'success' | 'fail' | 'inactive'
	created_at: string
	updated_at: string
	useCount: number
}

/**
 * 获取指定数量的代理ip
 * @param {number} count 最终获取的可用代理ip数量
 * @returns {objecr[]} 返回可用的代理ip数组
 */
export async function getProxyData(count: number, retryCount = 0) {
	console.log('获取代理ip')
	if (retryCount > 5) return []
	const proxys = (await useIpcRenderApi('proxy.active', {
		params: [{ limit: count }],
	})) as ProxyItem[]

	const proxyAll: ProxyItem[] = await testSpeed(proxys)
	let result = proxyAll.filter((v) => v.status === 'success')
	// 不可用代理 ip 数量
	const calc = proxys.length - result.length

	if (calc > 0) {
		// 标记为不可用的代理ip
		let failProxy = proxyAll.filter((v) => v.status !== 'success')
		if (mainWindow) {
			failProxy = failProxy.map((v) => {
				v.ttl = v.usageTime === Infinity ? 65535 : v.ttl
				v.status = 'inactive'
				return pick(v, ['ip', 'port', 'status', 'ttl']) as ProxyItem
			})
			await useIpcRenderApi('proxy.update', { params: [{ ips: failProxy }] })
		}

		console.log('proxy 不够所需数量', proxys.length, result.length)

		// 将新的代理ip合并
		retryCount++
		const calcProxy = await getProxyData(calc, retryCount)
		result = result.concat(calcProxy)
	}
	return result.sort((a, b) => a.usageTime - b.usageTime)
}

/**
 * 将代理ip标记为失效
 */
export async function proxyDisabled(proxy: ProxyItem) {
	proxy.status = 'inactive'
	proxy.ttl = 65535
	const proxyCopy = pick(proxy, ['ip', 'port', 'status', 'ttl'])
	await useIpcRenderApi('proxy.update', { params: [{ ips: [proxyCopy] }] })
}

/**
 * 对多条 ip 进行测速
 * @param {{ip: string, port: string}[]} options 参数
 */
export async function testSpeed(options: Data[], cb?: Function) {
	return Promise.all(options.map((v) => singleTest(v))).then((res) => {
		cb && cb(res)
		return res
	})
}

/**
 * 测试单条
 * @param {{ip: string, port: string}} option 参数
 */
function singleTest(option: Data) {
	console.log('开始单个测速', option.ip, option.port)
	const { ip, port } = option
	const proxy = {
		host: ip,
		port,
		auth: {
			username: 'xr6d72',
			password: 'kizunxr4',
		},
	}
	const result: Data = {
		beforeTime: Date.now(),
		usageTime: 0,
		...option,
	}
	const proxyPath = `${ip}:${port}`
	return axios({
		url: 'https://www.baidu.com',
		// url: 'https://www.amazon.com',
		method: 'get',
		proxy,
		timeout: 10 * 1000,
	})
		.then(() => {
			result.usageTime = Date.now() - result.beforeTime
			result.status = 'success'
			console.log('测速，返回成功', proxyPath)
			return result
		})
		.catch(() => {
			result.status = 'fail'
			result.usageTime = Infinity
			console.log('测速，返回异常', proxyPath)
			return result
		})
}
