/* https://stackoverflow.com/questions/2742813/how-to-validate-youtube-video-ids */

export default (str: string) => str.match(/^[a-zA-Z0-9_-]{11}$/);
