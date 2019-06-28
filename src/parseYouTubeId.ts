import isYouTubeId from './isYouTubeId';

export default (str: string) => {
    const match = str.match(/[a-zA-Z0-9_-]{11}$/);
    console.log('match', match);

    if (!match || !match.length) return null;

    const [id] = match;

    if (!isYouTubeId(id)) return null;

    return id;
}
