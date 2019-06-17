function throttle(minInterval, fn) {
    let timeoutCurrentlySet = false;
    let canCall = true; // Can call the function at the end of the interval?
    let lastArguments = [];

    const setNewTimeout = () => {
        setTimeout(() => {
            if (canCall) {
                fn(...lastArguments);

                timeoutCurrentlySet = false;
                canCall = false;
            }
        }, minInterval);
        timeoutCurrentlySet = true;
    };

    const update = (...args) => {
        lastArguments = args;

        // First call ever? Set the timer for the very first time.
        if (canCall && !timeoutCurrentlySet) {
            setNewTimeout();
            return;
        }

        // Called while a timeout is set? Only update arguments.
        if (canCall && timeoutCurrentlySet) {
            return;
        }

        // First after an interval finished.
        canCall = true;
        setNewTimeout();
    };

    const cancelPendingCall = () => {
        canCall = false;
        timeoutCurrentlySet = false;
    };

    const callImmediatelyIfPending = () => {
        if (timeoutCurrentlySet) {
            canCall = false;
            timeoutCurrentlySet = false;

            return fn(...lastArguments);
        }
    };

    return { update, cancelPendingCall, callOriginal: fn, callImmediatelyIfPending };
}

export default throttle;
