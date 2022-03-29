import axios from 'axios'
import router from '@renderer/router/index'
import { clearUserData } from '@renderer/assets/js/tools'
// const router = useRouter()

axios.interceptors.response.use(
	(config) => {
		return config
	},
	(err) => {
		if (err.response.status === 401) {
			console.log(localStorage)
			clearUserData()
			router.push('/login')
		}
	}
)
