const storage = window.localStorage;

export default {
	set: (k, v) => storage.setItem(k, v),
	get: k => storage.getItem(k)
};
