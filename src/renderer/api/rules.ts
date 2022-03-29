import axios from 'axios'
import { decrypt, encrypt } from '@renderer/assets/js/encrypt'

// 获取规则
export const get = () =>
	axios
		.get(
			`https://niubeikuajing.oss-cn-beijing.aliyuncs.com/soft/electron/rules.txt?r=${parseInt(
				(Date.now() / 1000 / 60) as any
			)}`
		)
		.then((res) => {
			// console.log(decrypt(res))
			return decrypt(res.data)
		})
