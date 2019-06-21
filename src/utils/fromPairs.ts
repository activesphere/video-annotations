export default function fromPairs<TValue>(iterable: Iterable<[string, TValue]>)
{
    const iterator = iterable[Symbol.iterator]();
    const object: {[s: string]: TValue} = {};
    let i = 0;
    while (true)
    {
        const {done, value} = iterator.next();
        if (!done) {
            object[value[0]] = value[1];
        }
        ++i;
    }
    return object;
}
