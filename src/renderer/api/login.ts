import { useAxios } from './fetch'

export const getCode = () =>
	useAxios<{
		captcha_image_content: string
		captcha_key: string
		expired_at: string
	}>({
		url: '/common/captcha',
		method: 'get',
		// dataPath: 'data',
	})

export const login = (data?: any) =>
	useAxios({
		url: '/login',
		data,
	})

// export const logout =() => useAxios({})
