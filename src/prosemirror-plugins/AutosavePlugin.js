import throttle from '../utils/throttle';
import { save as saveToLocalStorage } from '../LocalStorageHelper';
import { save as saveToDropbox } from '../DropboxHelper';

const ThrottleIntervalMS = 3000;

class AutosavePlugin {
    constructor(view, videoId) {
        this.didSaveToDropbox = false;
        this.lastNoteData = null;

        this.throttledSave = throttle(ThrottleIntervalMS, noteData => {
            saveToLocalStorage(noteData);

            this.promise = saveToDropbox(noteData);

            this.promise
                .then(() => {
                    this.didSaveToDropbox = true;
                })
                .catch(() => {
                    console.log('Error while saving to dropbox'); // eslint-disable-line no-console
                });
        });

        window.onbeforeunload = this.beforeUnload;

        this.view = view;
        this.videoId = videoId;
        this.update(view, null);
    }

    beforeUnload = () => {
        this.throttledSave.cancelPendingCall();

        if (this.lastNoteData) {
            this.throttledSave.callOriginal(this.lastNoteData);
        }
    };

    update() {
        this.docJSON = this.view.state.doc.toJSON();

        this.lastNoteData = {
            videoId: this.videoId,
            docJSON: this.docJSON,
            timeOfSave: Date.now() / 1000.0,
        };

        this.didSaveToDropbox = false;

        this.throttledSave.update(this.lastNoteData);
    }

    destroy() {
        window.removeEventListener('beforeunload', this.beforeUnload);
    }
}

export default AutosavePlugin;
