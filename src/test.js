let cheerio = require('cheerio')
cheerio = cheerio.default
const axios = require('axios')

function getClass(keyword) {
	const url = `https://www.amazon.com.br/s?k=${keyword}&language=en_US`
	return axios.get(url).then((res) => {
		console.log(res)
	})
}

getClass('dog')
