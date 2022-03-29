import { getProxyData } from '@main/task/proxy'
const axios = require('axios-https-proxy-fix')
const { ipcMain } = require('electron')

/**
 * 获取类目 - 使用代理
 */
export async function getCategoryAgent(keyword: string, countryUrl: string, countryCode: string) {
	const { ip, port } = (await getProxyData(1))[0]
	const url = `${countryUrl}s?k=${keyword}&language=${countryCode}`
	const proxy = {
		host: ip,
		port,
		auth: {
			username: 'xr6d72',
			password: 'kizunxr4',
		},
	}
	return axios({
		url,
		method: 'get',
		proxy,
		timeout: 20 * 1000,
	}).then((res) => res.data)
}

ipcMain.handle('get-category', (e, [keyword, countryUrl, countryCode]) => {
	return getCategoryAgent(keyword, countryUrl, countryCode)
})
