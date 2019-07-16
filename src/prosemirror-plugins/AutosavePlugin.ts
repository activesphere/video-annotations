import throttle from 'lodash/throttle';
import { save } from '../LocalStorageHelper';

const THROTTLE_INTERVAL = 3000;

class AutosavePlugin {
  throttledSave: any;
  view: any;
  videoId: string;
  title: string;

  constructor(view: any, name: string, videoId: string, title: string) {
    this.throttledSave = throttle((noteData: any) => {
      save(name, noteData).catch(() => {
        console.log('Error while saving to dropbox'); // eslint-disable-line no-console
      });
    }, THROTTLE_INTERVAL);

    window.onbeforeunload = this.beforeUnload;

    this.view = view;
    this.videoId = videoId;
    this.title = title;
    this.update();
  }

  beforeUnload = () => {
    this.throttledSave.flush();
  };

  update() {
    this.throttledSave({
      videoId: this.videoId,
      title: this.title,
      docJSON: this.view.state.doc.toJSON(),
      timeOfSave: new Date().toISOString(),
    });
  }

  destroy() {
    window.removeEventListener('beforeunload', this.beforeUnload);
  }
}

export default AutosavePlugin;
