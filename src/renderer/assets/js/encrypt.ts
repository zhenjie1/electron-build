import { encryptData, decryptData } from 'long-encrypt'
const JSEncrypt = require('jsencrypt')

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC+8mDUz5adWGOADgOs1DCNVeGhao81rRE/veXq0J70XU3mx1C4
OVZq4wJ7+5nXA4L5RNCUVizBIZUxcH660jmQNKEhXiSrizQi7NFUlZKUXHC9LHbV
JEhos9/C7fQT0Jjcvvg1BKpH/PTZVWLiZ6bqsK+tl8ev2ryqQgkl8k8DeQIDAQAB
AoGAJVcguH0f5wUx8AjNjy6vj/QLe5VrDAQcK2rnW1QQwZi9czPnBR+xVpWuFrDN
FM8K/dQHNfrkJaB7nH9zSPVza/koZX6hI5k2bEAwjcdtBTOYoW21cbhf7XkCh5EQ
SnTZ8UcNj5WD/OqFhevPlSa3sByugwOTl1TrCkbkT/DINQECQQDuLze5KYZQi/Qy
XawIldqDS096FKf8EtvSpjCElVeGJ5gt3GN1ri7EG0HlZB0vqel9UMhLy860Z3P/
9VYXgZodAkEAzTqmEYNAMDrFIMmr6C1fY5OXHkVse0W7rrpcAftt4s3UXf7sBh/Y
X3kQOEZXeEqH/Bt3UAG75/agU68AVQvwDQJBAKmqgOspJUBjMYRfLZjABnPYRbkU
1cS+OlCHibAoIbyyn7ircT324eFX+UzKT/AP/P8DeGplt8zSlNMTlEwSShECQCw9
6G7+DGhZQwW+dACpR1cACiPMc4ZfkgYoxozm1tl95bodqmPnmY17W7PF9jVIW+hN
Q3tL5GYtFIL1xuyOlkECQGps/PRMvHvgl6uadGkF02bb4s/T6q21hnea0nl6KpzM
+mcyj6zz+EdERoy+uHqaaWME50Z+td4dblCoEjlG2Ik=
-----END RSA PRIVATE KEY-----`

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+8mDUz5adWGOADgOs1DCNVeGh
ao81rRE/veXq0J70XU3mx1C4OVZq4wJ7+5nXA4L5RNCUVizBIZUxcH660jmQNKEh
XiSrizQi7NFUlZKUXHC9LHbVJEhos9/C7fQT0Jjcvvg1BKpH/PTZVWLiZ6bqsK+t
l8ev2ryqQgkl8k8DeQIDAQAB
-----END PUBLIC KEY-----`

export function encrypt(word) {
	const crypt = new JSEncrypt()
	crypt.setPublicKey(publicKey)

	word = encodeURIComponent(word)
	return encryptData(crypt, word, 100)
}

export function decrypt(string) {
	const crypt = new JSEncrypt()
	crypt.setPrivateKey(privateKey)
	const result = decryptData(crypt, string)

	const decryptContent = decodeURIComponent(result)
	try {
		return JSON.parse(decryptContent)
	} catch {
		console.error('解密失败')
		console.error(string)
		return ''
	}
}
