// Type of the listener functions is (path, matchObject) => any. If currently pushed path matches the
// regex associated with the listener we call the listener function with the path and the match object
// as arguments.

class StoredListener {
    constructor(listenerFn, name) {
        this.listenerFn = listenerFn;
        this.name = name;
    }
}

class HistoryPushListener {
    // A map of path patterns to listener functions
    listenerOfPath = new Map();

    addListener = (pathRegex, listenerFn, name='<unnamed listener>') => {
        if (typeof(pathRegex) === 'string') {
            pathRegex = new RegExp(pathRegex);
        }
        listenerOfPath.set(pathRegex, StoredListener(listenerFn));
    };

    pushState = (restoreInfo, newPath) => {
        window.history.pushState(restoreInfo, '', newPath);

        // Call the listeners that match this path
        this.listenerOfPath.forEach(({listenerFn, name}, pathRegex, _) => {
            const match = pathRegex.exec(newPath);
            if (match) {
                listenerFn(newPath, match);
            }
        });
    };
}

const historyPushListener = new HistoryPushListener();
export default historyPushListener;
