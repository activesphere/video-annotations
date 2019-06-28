import isURL from 'is-url';

const domains = ['www.youtube.com', 'youtube.com', 'youtu.be'];

export default (str: string) => {
    if (!isURL(str)) return false;

    const { host } = new URL(str);

    if (!domains.includes(host)) return false;
    return true;
}
