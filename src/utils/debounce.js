/*
// https://medium.com/@TCAS3/debounce-deep-dive-javascript-es6-e6f8d983b7a1
const debounce = (fn, time) => {
    let timeout;

    return function() {
        const functionCall = () => fn.apply(this, arguments);

        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
    };
};

export default debounce;
*/

// Debounce, with a callRightNow method.
function debounce(fn, interval) {
    let timeoutCurrentlySet = false;
    let canSetNewCallable = true;
    let lastArguments = [];
    let gotCancelled = false;

    const setNewTimeout = () => {
        setTimeout(() => {
            if (canSetNewCallable) {
                if (!gotCancelled) {
                    fn.apply(lastArguments);
                } else {
                    gotCancelled = false;
                }

                timeoutCurrentlySet = false;
                canSetNewCallable = false;
            }
        }, interval);
        timeoutCurrentlySet = true;
    };

    const wrapped = () => {
        // Starting state? Begins the very first interval. Set timeout with the function and the given arguments.
        if (canSetNewCallable && !timeoutCurrentlySet) {
            setNewTimeout();
            return;
        }

        // Called mid-interval with a previous call already issued? Only need to set the new arguments.
        if (canSetNewCallable && timeoutCurrentlySet) {
            lastArguments = arguments;
            return;
        }

        // Else, call denotes beginning of a new interval.
        canSetNewCallable = true;
        lastArguments = arguments;
        setNewTimeout();
    };

    wrapped.callRightNow = () => {
        wrapped.gotCancelled = true;
        fn.apply(lastArguments);
    };

    return wrapped;
}

export default debounce;
