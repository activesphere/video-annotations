// https://gist.github.com/creationix/7435851
// Joins path segments.  Preserves initial "/" and resolves ".." and "."
// Does not support using ".." to go above/outside the root.
// This means that join("foo", "../../bar") will not resolve to "../bar"
export default function pathJoin(...args) {
    let parts = [];
    for (let i = 0; i < args.length; i++) {
        parts = parts.concat(args[i].split('/'));
    }
    const newParts = [];
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i];
        if (!part || part === '.') continue;
        if (part === '..') newParts.pop();
        else newParts.push(part);
    }
    if (parts[0] === '') newParts.unshift('');
    return newParts.join('/') || (newParts.length ? '/' : '.');
}
