let namespace = null;

if (typeof chrome !== 'undefined') {
    if (typeof browser !== 'undefined') {
        namespace = browser;
    } else {
        namespace = chrome;
    }
} else {
    throw `Not chrome or firefox`;
}

export default namespace;
