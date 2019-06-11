import debounce from '../utils/debounce';
import * as LS from '../LocalStorageHelper';

const debouncedSaveNote = debounce((videoId, noteData) => {
    LS.saveNoteWithId(videoId, noteData);
}, 3000);

class AutosavePlugin {
    constructor(view, videoId) {
        this.view = view;
        this.videoId = videoId;
        this.update(view, null);
    }

    update() {
        const docJSON = this.view.state.doc.toJSON();

        const noteData = {
            videoId: this.videoId,
            docJSON,
            timeOfSave: Date.now() / 1000.0,
        };

        debouncedSaveNote(this.videoId, noteData);
    }

    destroy() {}
}

export default AutosavePlugin;
