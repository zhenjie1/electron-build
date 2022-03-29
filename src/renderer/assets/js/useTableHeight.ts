import { debounce } from 'lodash'

const elObserver = new WeakMap()

export function useTableHeight(offset = 0) {
	const observeEl = ref<Element | null>(null)
	const height = ref(1000)
	const headerHeight = 0

	onMounted(() => {
		if (!observeEl.value) return
		const oel: any = observeEl.value
		const el: Element = oel?.$el || oel

		domObserver(el, () => {
			const elHeight = el.getBoundingClientRect().height
			// console.log('parent height', innerHeight, 'el height', elHeight, el)
			height.value = Math.floor(innerHeight - headerHeight - 30 - elHeight + offset)
		})
	})

	onBeforeUnmount(() => {
		if (!observeEl.value) return
		stopDomObserver(observeEl.value)
	})

	return {
		height,
		observeEl,
	}
}

/**
 * 停止对一个元素监听
 *
 * @param {HTMLElement} el 创建监听对象时 监听的 html 元素
 * @returns {void}
 */
export function stopDomObserver(el: Element) {
	const saveObserver = elObserver.get(el)

	if (!saveObserver) return
	const { observer, fn } = saveObserver
	// 停止监听
	observer.disconnect()

	// 删除存储的对象
	elObserver.delete(el)

	// 移除对 window resize 的监听
	window.removeEventListener('resize', fn)
}

/**
 * 监听变化
 *
 * @param {HTMLElement} el 要监听的 html 元素
 * @param {Function} callback 回调
 * @returns {void}
 */
export function domObserver<El extends Element, Cb extends (...args: any) => any>(
	el: El,
	callback: Cb
) {
	if (!el || typeof callback !== 'function') throw new Error('监听失败')
	if (elObserver.has(el)) return
	// callback()
	requestAnimationFrame(callback)

	const observer = createMutationObserverObject(callback)
	observer.observe(el, {
		childList: true, // 观察目标子节点的变化，添加或者删除
		attributes: true, // 观察属性变动
		subtree: true, // 默认为 false，设置为 true 可以观察后代节点
	})

	const fn = debounce(() => callback(), 200)
	window.addEventListener('resize', fn)

	elObserver.set(el, { el, observer, fn })
}

/**
 * 创建MutationObserver对象及其回调
 *
 * @param {Function} cb 回调
 * @returns {MutationObserver} 监听对象
 */
function createMutationObserverObject(cb: Function) {
	const MutationObserver = window.MutationObserver

	return new MutationObserver(() => {
		cb && cb()
	})
}
