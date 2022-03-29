export const isDev = process.env.NODE_ENV === 'development'

/**
 * 复制字符串到剪贴板
 */
export function copy(string: string) {
	const input = document.createElement('input')
	document.body.appendChild(input)
	input.setAttribute('value', string)
	input.select()
	if (document.execCommand('copy')) {
		document.execCommand('copy')
	}
	document.body.removeChild(input)
}
