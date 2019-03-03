import testSavedMap from './test_saved_map';
import dropboxHelper from './dropboxHelper';

// Search results

export class SearchResult {
    constructor(mainText, subText, key) {
        this.mainText = mainText;
        this.subText = subText;
        this.key = key;
    }
}

// localStorage key for the full JSON object we are storing which contains *all* notes. Notes will
// be keyed by video id.
const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

// If you want to load that test note data.
const LOAD_TEST_DATA = true;

// If you want to use copy the save data and put it in a source file and use as test data.
const LOG_SAVE_DATA_TO_CONSOLE = false;

class LocalStorageHelper {
    constructor() {
        // Map of video id to note data.
        this.strMap = localStorage.getItem(VIDEO_ID_TO_NOTE_DATA);
        if (!this.strMap) {
            if (LOAD_TEST_DATA) {
                console.log('No previously saved data. Loading test save data.');
                this.strMap = JSON.stringify(testSavedMap);
                this.videoIdToNoteData = testSavedMap;
            } else {
                this.videoIdToNoteData = {};
                this.strMap = '{}';
            }
        } else {
            this.videoIdToNoteData = JSON.parse(this.strMap);
            console.log('Keys of saved notes = ', Object.keys(this.videoIdToNoteData));
            console.log('Loaded save data.');
        }
    }

    flushToLocalStorage = () => {
        const strJsonMap = JSON.stringify(this.videoIdToNoteData);

        // Don't write needlessly. TODO: This depends on whether stringify(json1) = stringify(json2)
        // given json1 == json2. No reason to assume this is the case. Fix this.
        if (this.strMap !== strJsonMap) {
            localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, strJsonMap);
            this.strMap = strJsonMap;

            if (LOG_SAVE_DATA_TO_CONSOLE) {
                console.log('Latest strMap =\n', strJsonMap);
                console.log(this.strMap);
            }
        }
    };

    // Returns the editor value for the note associated with given video id, if the value exists.
    loadNoteWithId = videoId => {
        const key = videoId;

        if (!(key in this.videoIdToNoteData)) {
            console.log('No note for video Id ', videoId);
            return {};
        }

        const noteData = this.videoIdToNoteData[key];

        return {
            editorValueAsJson: this.videoIdToNoteData[key].editorValueAsJson,
            noteName: noteData.noteName,
            videoTitle: noteData.videoTitle,
        };
    };

    saveNoteWithId = (videoId, noteData) => {
        if (!videoId) {
            console.warn('video id was undefined');
            return;
        }

        const key = videoId;
        this.videoIdToNoteData[key] = noteData;
        console.log('Saved note for video', noteData.videoTitle);
        this.flushToLocalStorage();
    };

    deleteNoteWithId = videoId => {
        if (!videoId) {
            console.warn('video id was undefined');
            return;
        }

        const key = videoId;
        if (this.videoIdToNoteData[key]) {
            delete this.videoIdToNoteData[key];
            this.flushToLocalStorage();
            console.log('Deleted note for video', videoId);
        } else {
            console.log('No note for video ', videoId);
        }
    };

    getNoteMenuItems = () => {
        const keys = Object.keys(this.videoIdToNoteData);
        const items = [];

        // For each note, return the video name as the label and videoId as the value.
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];

            if (this.videoIdToNoteData.hasOwnProperty(key)) {
                const noteData = this.videoIdToNoteData[key];

                // react-select requires the label will appear on the item and the associated value.
                items.push({
                    label: noteData.videoTitle,
                    value: noteData.videoId,
                });
            }
        }
        return items;
    };

    getNoteMenuItemsForCards = () => {
        const keys = Object.keys(this.videoIdToNoteData);
        const cardInfos = [];

        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];

            if (this.videoIdToNoteData.hasOwnProperty(key)) {
                const noteData = this.videoIdToNoteData[key];

                // TODO: Send a 'shortened' text of the contents of the card too.
                cardInfos.push({
                    videoTitle: noteData.videoTitle,
                    videoId: noteData.videoId,
                });
            }
        }
        return cardInfos;
    };

    // Update dropbox file or localstorage note depending on which one is older.
    async syncWithDropbox() {
        if (!dropboxHelper.isInitialized()) {
            console.log('Not syncing localStorage with dropbox');
            return;
        }

        const dbNoteDataById = await dropboxHelper.downloadAllNoteFiles();

        const promisesOfUploadingNotes = [];

        for (const videoId of Object.keys(this.videoIdToNoteData)) {
            const lsNoteData = this.videoIdToNoteData[videoId];
            const dbNoteData = dbNoteDataById[videoId];
            // console.log('dbNoteData =', dbNoteData);
            if (!dbNoteData || dbNoteData.timeOfSave < lsNoteData.timeOfSave) {
                promisesOfUploadingNotes.push(dropboxHelper.save(lsNoteData));

                console.log(
                    `Updating Dropbox for note ${videoId}, title - ${lsNoteData.videoTitle}`
                );
            }
        }

        // Wait for all the notes to upload.
        const _ignore = await Promise.all(promisesOfUploadingNotes);

        // Do the same in the other direction. If there's files in dropbox but not in localstorage or there's
        // a note with same id but time of save is older in localstorage than that in dropbox,
        // overwrite localstorage's content.
        let updatedLocalMap = false;
        for (const videoId of Object.keys(dbNoteDataById)) {
            const dbNoteData = dbNoteDataById[videoId];
            const lsNoteData = this.videoIdToNoteData[videoId];
            // console.log('dbNoteData =', dbNoteData);
            if (!lsNoteData || lsNoteData.timeOfSave < dbNoteData.timeOfSave) {
                updatedLocalMap = true;
                this.videoIdToNoteData[videoId] = dbNoteData;
                console.log(
                    `Updating localstorage for note ${videoId}, title - ${dbNoteData.videoTitle}`
                );
            }
        }

        if (updatedLocalMap) {
            this.flushToLocalStorage();
        }
    }
}

const localStorageHelper = new LocalStorageHelper();

export default localStorageHelper;
