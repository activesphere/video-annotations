import isYouTubeId from './isId';

export default (str: string) => {
  if (!str) return null;

  const match = str.match(/[a-zA-Z0-9_-]{11}$/);

  if (!match || !match.length) return null;

  const [id] = match;

  if (!isYouTubeId(id)) return null;

  return id;
};
