import { set } from 'idb-keyval'
import axios, { AxiosRequestConfig } from 'axios'
import { FetchResult, FETCHURLKEY, Params } from './utils'

export interface UrlCacheData<T = FetchResult> {
	data: T
}
/**
 * [key: string(url)]: result any
 */
export const urlCaches = new Map<string, UrlCacheData>()

/**
 * api cache set
 * @returns {void}
 */
export function apiCacheSet(options: AxiosRequestConfig & Params, data: FetchResult) {
	const { url } = options
	if (typeof url !== 'string') throw new Error('path not is a string')

	const cacheData: UrlCacheData = { data }
	urlCaches.set(url, cacheData)

	set(FETCHURLKEY + url, cacheData)
}

/**
 * api cache get
 * @returns {Data|undefined}
 */
export function apiCacheGet<T>(path: string) {
	if (typeof path !== 'string') throw new Error('path not is a string')
	return urlCaches.get(path) as any as UrlCacheData<T>
}

/**
 * axios response intercept
 */
axios.interceptors.response.use((configs) => {
	const { config, data, status } = configs
	const conf = config as AxiosRequestConfig & Params

	if (status === 200 && conf.store) apiCacheSet(conf, data)

	return configs
})
