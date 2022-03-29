import axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios'
import type { Ref } from 'vue'
import defaultParams, { removeSurplusData } from './defaultParams'
import { getData } from './url'
import { APIFetchReturn, errorDealWith, FetchResult, Params, readCache } from './utils'

type Success<T> = (data: T) => void
type Fail<T> = (error: AxiosError<T>) => void

/**
 * Wrapper for axios.
 *
 * @see https://vueuse.org/useAxios
 * @param url
 * @param config
 */
export function useAxios<T = any>(config: Params): APIFetchReturn<T> {
	const response = shallowRef<AxiosResponse<T>>()
	const sourceData = ref<FetchResult<T>>(config.defaultValue)
	const data = computed<T>(() => getData(config, sourceData.value)) as Ref<T>
	const isFinished = ref(false)
	const isLoading = ref(false)
	const aborted = ref(false)
	const error = shallowRef<AxiosError<T>>()
	const successPool: Success<T>[] = []
	const failPool: Fail<T>[] = []

	let resolve: Function
	let reject: Function

	const cancelToken: CancelTokenSource = axios.CancelToken.source()
	const abort = (message?: string) => {
		if (isFinished.value || !isLoading.value) return

		cancelToken.cancel(message)
		aborted.value = true
		isLoading.value = false
		isFinished.value = false
	}

	const result: APIFetchReturn<T> = {
		response,
		execute: (config) => {},
		sourceData,
		data,
		error,
		finished: isFinished,
		loading: isLoading,
		isFinished,
		success: (cb: Success<T>) => successPool.push(cb),
		fail: (cb: Fail<T>) => failPool.push(cb),
		isLoading,
		cancel: abort,
		canceled: aborted,
		aborted,
		abort,
		start,
		then(res: any, rej: any) {
			isLoading.value = true
			resolve = res
			reject = rej
		},
	}

	config = defaultParams(config)

	readCache(config, result)

	function start(params?: any): APIFetchReturn<T> {
		const dataKey: 'params' | 'data' =
			config.method?.toLocaleLowerCase() === 'get' ? 'params' : 'data'
		config[dataKey] = removeSurplusData(params) || {}
		config[dataKey].device = 'desktop'
		isLoading.value = true

		axios({ ...config, cancelToken: cancelToken.token })
			.then((r: any) => {
				response.value = r
				sourceData.value = r.data

				if (r.data.code !== 0) {
					failPool.map((fn) => fn(r))
					throw r
				} else {
					successPool.map((fn) => fn(data.value!))

					resolve?.(data)
					return data
				}
			})
			.finally(() => {
				isLoading.value = false
				isFinished.value = true
			})
			.catch((e: any) => {
				error.value = e
				failPool.map((fn) => fn(e))
				errorDealWith(e.response?.data.msg || e.data?.message)
				reject?.(e)
			})
		return result
	}

	return result
}
