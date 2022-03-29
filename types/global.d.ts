export {}
declare global {
	type Data<T = any> = {
		[key: string]: T
	}

	interface Window {
		onTelegramAuth: (data: any) => void
		ipcRenderer: any
		globalConfig: {
			debug: boolean
		}
	}
}
