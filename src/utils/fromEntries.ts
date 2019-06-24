export default function fromEntries<TValue>(pairs: Array<[string, TValue]>) {
	return pairs.reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
}
