import { TaskInfo } from './type'

/// 不使用代理ip的国家
const ignoreCountry = ['JP']

/**
 * 是不是不走代理ip的国家
 * @returns {boolean} true: 是 不走代理； false: 不是 走代理
 */
export function isIgnoreCountry(data: string | TaskInfo) {
	let code: string
	if (typeof data === 'object') {
		code = data.market_site.country_code
	} else {
		code = data
	}
	code = code.toLocaleUpperCase()

	return ignoreCountry.includes(code)
}
