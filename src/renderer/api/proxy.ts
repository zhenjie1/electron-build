import { useAxios } from './fetch'

// 列表
export const list = (data: Data) =>
	useAxios({
		url: '/proxy-ip-pool/index',
		method: 'get',
		params: data,
	})

// 创建
export const create = (ips) =>
	useAxios({
		url: '/proxy-ip-pool/batch-create',
		method: 'post',
		data: { ips },
	})

// 修改
export const change = () => {
	return useAxios({
		url: '/proxy-ip-pool/create',
		method: 'post',
	})
}

// 批量删除
export const remove = (ids) =>
	useAxios({
		url: '/proxy-ip-pool/delete',
		method: 'post',
		data: { ids },
	})

// 获取最快的代理ip
export const getQuick = (limit = 10) =>
	useAxios({
		url: '/proxy-ip-pool/index',
		method: 'get',
		params: {
			order_by: 'ttl asc',
			limit,
			status: 'active',
		},
	}).then((res: Data) => res.data?.list?.data || [])

// 批量 更新代理ip
export const update = (ips = []) =>
	useAxios({
		url: '/proxy-ip-pool/batch-create',
		method: 'post',
		data: { ips },
	})

// 获取新的ip
export const active = (limit = 4) =>
	useAxios({
		url: '/proxy-ip-pool/active',
		method: 'get',
		params: { limit },
	}) // .then((res: Data) => res.data)
