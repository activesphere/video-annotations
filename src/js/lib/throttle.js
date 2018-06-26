export default function throttle(callback, wait = 300, context = this) {
	let timeout;
	let callbackArgs;

	const later = () => {
		callback.apply(context, callbackArgs);
		timeout = null;
	};

	return (...args) => {
		if (!timeout) {
			callbackArgs = args;
			timeout = setTimeout(later, wait);
		}
	};
}
