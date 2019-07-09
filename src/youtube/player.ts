import { useEffect, useRef, useReducer } from 'react';
import parseId from './parseId';
import fetchTitle from './fetchTitle';

interface State {
  videoId: string | null;
  title: string | null;
  videoLoaded: boolean;
  titleFetched: boolean;
}

const initialState = {
  videoId: null,
  title: null,
  videoLoaded: false,
  titleFetched: false,
};

type Action =
  | { type: 'videoLoaded' }
  | { type: 'fetchTitle' }
  | { type: 'resetPlayer' }
  | { type: 'titleFetched'; title: string }
  | { type: 'load'; videoId: string };

type Props = {
  api: any;
  el: HTMLElement | null;
  videoId?: string;
  dispatch: (action: Action) => void;
};

const playerStateReducer = (state: State = initialState, action: Action): State => {
  const { videoId, videoLoaded, titleFetched, title } = state;

  switch (action.type) {
    case 'videoLoaded':
      return { ...state, videoLoaded: true };

    case 'fetchTitle':
      return { ...state, titleFetched: false, title: null };

    case 'titleFetched':
      return { ...state, titleFetched: true, title: action.title };

    case 'resetPlayer':
      return { videoId: null, videoLoaded: false, titleFetched: false, title: null };

    case 'load':
      return { ...state, videoId: action.videoId, videoLoaded: false, titleFetched: false };

    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const YouTubePlayer = ({ api, el, videoId, dispatch }: Props) => {
  const player: YT.Player = new api.Player(el, {
    height: '100%',
    width: '100%',
    videoId,
    events: {
      onReady: () => {
        dispatch({ type: 'videoLoaded' });

        player.playVideo();
      },
    },
  });

  if (videoId) {
    fetchTitle(videoId).then(title => {
      dispatch({ type: 'titleFetched', title });
    });
  }

  dispatch({ type: 'resetPlayer' });

  console.log('player', player, api);

  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seek: (timestamp: number) => {
      player.seekTo(timestamp, true);
    },
    seekRelative: (interval: number) => {
      const ts = player.getCurrentTime();
      player.seekTo(ts + interval, true);
    },
    togglePause: () => {
      player.getPlayerState() === 2 ? player.playVideo() : player.pauseVideo();
    },
    load: (videoId: string) => {
      dispatch({ type: 'resetPlayer' });
      fetchTitle(videoId).then(title => {
        console.log('fetchTitle', title);
        dispatch({ type: 'titleFetched', title });
      });
      player.loadVideoById(videoId);
    },
    getVideoId: () => parseId(player.getVideoUrl()),
    getCurrentTime: () => player.getCurrentTime(),
    getDuration: () => player.getDuration(),
    getVideoUrl: () => player.getVideoUrl(),
    destroy: () => {
      dispatch({ type: 'resetPlayer' });
      player.destroy();
    },
  };
};

type PlayerProps = {
  api: YT.Player;
  videoId?: string;
  ref: React.RefObject<HTMLElement>;
};
const usePlayer = ({ api, videoId, ref }: PlayerProps) => {
  const player = useRef<any>();

  const [state, dispatch] = useReducer(playerStateReducer, initialState);

  useEffect(() => {
    if (!ref.current || !videoId) return;
    player.current = YouTubePlayer({ api, videoId, el: ref.current, dispatch });

    return () => player.current.destroy();
  }, [api, videoId, ref, player, dispatch]);

  const { videoLoaded, titleFetched, title } = state;

  return {
    player,
    isLoading: !videoLoaded || !titleFetched,
    videoId,
    title,
  };
};

export default usePlayer;
