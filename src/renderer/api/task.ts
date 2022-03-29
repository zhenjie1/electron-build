import { useAxios } from './fetch'

export const getPageDom = (url: string) =>
	fetch(url).then(async (res) => {
		if (/^5/.test(res.status.toString())) {
			throw res
		}
		return await res.text()
	})
