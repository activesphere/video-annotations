const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  alert('REACT_APP_YOUTUBE_API_KEY required in .env file');
}

const fetchTitle = async (id: string) => {
  if (!YOUTUBE_API_KEY || !id) return null;

  const queryParams = `key=${encodeURIComponent(YOUTUBE_API_KEY)}&id=${encodeURIComponent(id)}`;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&${queryParams}`;

  try {
    const res = await fetch(url);
    const { error, items }: { error: any; items: any[] } = await res.json();
    if (error) {
      console.error('fetchTitle: ', error); // eslint-disable-line no-console
      return null;
    }

    if (!items.length) {
      console.error(`fetchTitle: Empty response. Check if video ${id} exists.`); // eslint-disable-line no-console
      return null;
    }

    return items[0].snippet.title;
  } catch (e) {
    console.error('fetchTitle: ', e.message); // eslint-disable-line no-console
    return null;
  }
};

export default fetchTitle;
