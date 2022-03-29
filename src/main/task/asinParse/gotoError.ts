import { TaskAsin, TaskPage } from '../taskChild'
type Task = TaskAsin | TaskPage

export type GotoErrorCode =
	| 'TimeOut'
	| 'NotResolved'
	| 'InternetDisconnected'
	| 'ERR_TUNNEL_CONNECTION_FAILED'
	| 'PAGE503'
	| 'ERR_HTTP_RESPONSE_CODE_FAILURE'
	| 'ERR_CONNECTION_CLOSED'
/**
 * puppeteer goto 报错后的处理
 * @param error
 */
export const gotoErrorDealWith = (error: Error): GotoErrorCode => {
	const { name, message } = error
	if (name === 'TimeoutError') {
		console.log('超时了')
		return 'TimeOut'
	}

	if (message.includes('ERR_HTTP_RESPONSE_CODE_FAILURE')) {
		console.log('应进入重试机制')
		return 'ERR_HTTP_RESPONSE_CODE_FAILURE'
	}

	if (message.includes('ERR_NAME_NOT_RESOLVED')) {
		console.log('无法解析该网址')
		return 'NotResolved'
	}
	if (message.includes('ERR_INTERNET_DISCONNECTED')) {
		console.log('老弟，你的网断了')
		return 'InternetDisconnected'
	}
	if (message.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
		console.log('此代理ip无法使用')
		return 'ERR_TUNNEL_CONNECTION_FAILED'
	}

	if (message.includes('ERR_CONNECTION_CLOSED')) {
		console.log('应进入重试机制')
		return 'ERR_CONNECTION_CLOSED'
	}
	console.log('name ->', name, 'message ->', message, error)
}
