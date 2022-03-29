const { ipcRenderer } = require('electron')
let $JQ = require('cheerio')
$JQ = $JQ.default
// import $JQ from 'jquery'
import axios from 'axios'

/**
 * 获取类目
 */
export function getCategory(keyword: string, countryUrl: string, countryCode: string) {
	const url = `${countryUrl}s?k=${keyword}&language=${countryCode}`
	return axios
		.get(url)
		.then((res) => categoryParse(res.data, url))
		.catch(async () => {
			const html = await ipcRenderer.invoke('get-category', [
				keyword,
				countryUrl,
				countryCode,
			])
			return categoryParse(html, countryUrl)
		})
}

/**
 * 类目解析
 */
export function categoryParse(html: string, url: string) {
	const $html = $JQ(html)
	const $departments = $html.find('#departments > ul > li')
	const filterN = $html.find('#filter-n')

	if ($departments.length) {
		const data = $departments.toArray().reduce((total, li, i) => {
			const $li = $JQ(li)
			const $parent = $li.find('ul')

			if ($parent.length) {
				const $lis = $parent.children('li')
				$lis.each((i, li) => {
					const $li = $JQ(li)
					const label = $li.text().trim()
					const value = $li.find('a').first().attr('href')
					total.push({ label, value })
				})
			} else {
				// 是不是子级
				const isChild = $li.hasClass('s-navigation-indent-1')
				const label = $li.text().trim()
				const value = $li.find('a').first().attr('href')

				if (!isChild) total.push({ label, value })
				else {
					const last = total.at(-1)
					if (!last.children) last.children = []
					last.children.push({ label, value })
				}
			}
			return total
		}, [])
		return data
	} else if (filterN) {
		const filterNArr = filterN.toArray()
		const isOnly = filterNArr.length === 1

		return filterNArr.reduce((total, el, i) => {
			const urlval = new URL(url)
			urlval.searchParams.append('index', i)
			const label = $JQ(el).find('.a-section.a-text-left span').text().trim()
			let value = urlval.href
			let children: Data[] | undefined

			if ($JQ(el).find('.a-section.sf-filter-section').length) {
				children = []
				$JQ(el)
					.find('.a-section.sf-filter-section a')
					.each((j, a) => {
						const cLabel = $JQ(a).text().trim()
						const cValue = $JQ(a).attr('href')
						if (i === 0 && cLabel.toLocaleLowerCase() === 'all') value = cValue
						children.push({ label: cLabel, value: cValue })
					})
			}

			total.push({ label, value, children })

			if (isOnly) total = children

			return total
		}, [])
	}
	return []
}
