import testSavedMap from "./test_saved_map";

// A JSON serializable object representing a full note. Kept as values in the VIDEO_ID_TO_NOTE_DATA
// map.
export class NoteData {
    constructor(videoId, videoTitle, jsonEditorValue, noteName = '') {
        this.videoId = videoId;
        this.strJsonEditorValue = JSON.stringify(jsonEditorValue);
        this.videoTitle = videoTitle;
        this.noteName = noteName;
    }
}

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
const LOG_SAVE_DATA_TO_CONSOLE = true;

class NoteStorageManager {
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
        const key = `saved_note_${videoId}`;

        if (!(key in this.videoIdToNoteData)) {
            console.log('No note for video Id ', videoId);
            return {};
        }

        const noteData = this.videoIdToNoteData[key];

        return {
            jsonEditorValue: JSON.parse(this.videoIdToNoteData[key].strJsonEditorValue),
            noteName: noteData.noteName,
            videoTitle: noteData.videoTitle,
        };
    };

    saveNoteWithId = (videoId, noteData) => {
        const key = `saved_note_${videoId}`;
        this.videoIdToNoteData[key] = noteData;
        console.log('Saved note for video', noteData.videoTitle);
        this.flushToLocalStorage();
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
        console.log('items = ', items);
        return items;
    };
}

export const noteStorageManager = new NoteStorageManager();
