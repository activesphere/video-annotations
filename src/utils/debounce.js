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
