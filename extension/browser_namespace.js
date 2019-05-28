let namespace = null;

if (typeof chrome === 'undefined') {
    throw new Error('Only chrome and firefox browsers are supported');
}

export default (typeof browser === 'undefined' ? chrome : browser);
