export function regexPrice(price: string) {
	let defaultPrice = 0
	if (price.indexOf('R$') > -1) {
		defaultPrice = specialPrice(price, 'R$')
		return defaultPrice
	}
	if (price.indexOf('$') > -1 && price.indexOf('S$') == -1) {
		defaultPrice = specialPrice(price, '$')
		return defaultPrice
	}
	if (price.indexOf('₹') > -1) {
		defaultPrice = specialPrice(price, '₹')
		return defaultPrice
	}
	if (price.indexOf('zł') > -1) {
		defaultPrice = specialPrice(price, 'zł')
		return defaultPrice
	}
	if (price.indexOf('€') > -1) {
		defaultPrice = specialPrice(price, '€')
		return defaultPrice
	}
	if (price.indexOf('kr') > -1) {
		defaultPrice = specialPrice(price, 'kr')
		return defaultPrice
	}
	if (price.indexOf('¥') > -1) {
		defaultPrice = specialPrice(price, '¥')
		return defaultPrice
	}
	if (price.indexOf('AED') > -1) {
		defaultPrice = specialPrice(price, 'AED')
		return defaultPrice
	}
	if (price.indexOf('£') > -1) {
		defaultPrice = specialPrice(price, '£')
		return defaultPrice
	}
	if (price.indexOf('SAR') > -1) {
		defaultPrice = specialPrice(price, 'SAR')
		return defaultPrice
	}
	if (price.indexOf('S$') > -1) {
		defaultPrice = specialPrice(price, 'S$')
		return defaultPrice
	}
	return defaultPrice
}
export function specialPrice(price: string, symbol: string) {
	let activePrice = -1
	if (symbol === 'R$') {
		return parseFloat(price.replace(/^[^0-9]+/, '').replace(',', '.'))
	} else if (symbol === '₹') {
		return parseFloat(price.replace(/^[^0-9]+/, '').replace(',', ''))
	} else if (symbol === 'SAR') {
		return parseFloat(price.replace(/^[^0-9]+/, '').replace(',', ''))
	} else if (symbol == '€') {
		if (price.split('-').length > 0) {
			if (price.indexOf(',') > -1 && price.indexOf('.') > -1) {
				activePrice = Number(price.split('-')[0].replace(symbol, '').replace(',', ''))
			} else {
				activePrice = Number(price.split('-')[0].replace(symbol, '').replace(',', '.'))
			}
		} else {
			if (price.indexOf(',') > -1 && price.indexOf('.') > -1) {
				activePrice = Number(price.replace(symbol, '').replace(',', ''))
			} else {
				activePrice = Number(price.replace(symbol, '').replace(',', '.'))
			}
		}
	} else if (symbol == '¥') {
		if (price.split('-').length > 0) {
			activePrice = Number(price.split('-')[0].replace(symbol, '').replace(',', ''))
		} else {
			activePrice = Number(price.replace(symbol, '').replace(',', ''))
		}
	} else if (symbol == 'kr') {
		if (price.split('-').length > 1) {
			activePrice = Number(
				price.replace(' ', '').split('-')[0].replace(symbol, '').replace(',', '.')
			)
		} else {
			activePrice = Number(
				price
					.replace(String.fromCharCode(160), '')
					.replace(String.fromCharCode(8206), '')
					.replace(symbol, '')
					.replace(',', '.')
					.trim()
			)
		}
	} else if (symbol == 'zł') {
		if (price.split('-').length > 0) {
			activePrice = Number(
				price.replace(' ', '').split('-')[0].replace(symbol, '').replace(',', '.')
			)
		} else {
			activePrice = Number(price.replace(symbol, '').replace(',', '.'))
		}
	} else {
		if (price.split('-').length > 0) {
			activePrice = Number(price.split('-')[0].replace(symbol, ''))
		} else {
			activePrice = Number(price.replace(symbol, '').replace(',', '.'))
		}
	}

	return activePrice
}
