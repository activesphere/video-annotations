import throttle from 'lodash/throttle';
import { save as saveToLocalStorage } from '../LocalStorageHelper';
import { save as saveToDropbox } from '../DropboxHelper';

const ThrottleIntervalMS = 3000;

class AutosavePlugin {
  constructor(view, videoId) {
    this.didSaveToDropbox = false;
    this.lastNoteData = null;

    this.throttledSave = throttle(noteData => {
      saveToLocalStorage(noteData);

      this.promise = saveToDropbox(noteData);

      this.promise
        .then(() => {
          this.didSaveToDropbox = true;
        })
        .catch(() => {
          console.log('Error while saving to dropbox'); // eslint-disable-line no-console
        });
    }, ThrottleIntervalMS);

    window.onbeforeunload = this.beforeUnload;

    this.view = view;
    this.videoId = videoId;
    this.update(view, null);
  }

  beforeUnload = () => {
    this.throttledSave.flush();
  };

  update() {
    this.docJSON = this.view.state.doc.toJSON();

    this.lastNoteData = {
      videoId: this.videoId,
      docJSON: this.docJSON,
      timeOfSave: Date.now() / 1000.0,
    };

    this.didSaveToDropbox = false;

    this.throttledSave(this.lastNoteData);
  }

  destroy() {
    window.removeEventListener('beforeunload', this.beforeUnload);
  }
}

export default AutosavePlugin;
