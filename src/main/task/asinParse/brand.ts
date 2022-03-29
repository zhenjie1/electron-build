import { ProxyItem } from '../proxy'
import axios from 'axios'
const axiosProxy = require('axios-https-proxy-fix')

/**
 * 获取品牌数据
 */
export default async function getBrandData(brand: string, proxyData?: ProxyItem): Promise<Data[]> {
	let http: Promise<Data>
	if (!brand) return []

	brand = encodeURIComponent(brand)

	const url = `https://www3.wipo.int/bnd-api/gipp/v1/brand/results?q=${brand}`
	const timeout = 10 * 1000
	if (proxyData) {
		const { ip, port } = proxyData
		const proxy = {
			host: ip,
			port,
			auth: {
				username: 'xr6d72',
				password: 'kizunxr4',
			},
		}

		http = axiosProxy({
			url,
			method: 'get',
			proxy,
			timeout,
		})
	} else {
		http = axios.get(url, {
			timeout,
		})
	}

	return http
		.then((data: Data = {}) => {
			data = data.data
			if (Array.isArray(data.topResults)) {
				return data.topResults.map((v) => ({
					status: v.status,
					origin: v.originCountry,
				}))
			}
			return []
		})
		.catch((error) => {
			console.error(error)
			return []
		})
}
