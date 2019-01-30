// localStorage key for the full JSON object we are storing which contains *all* notes. Notes will
// be keyed by video id.
const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

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

class NoteLabel {
    constructor(noteName, videoId) {
        this.noteName = noteName;
        this.videoId = videoId;
    }

    toString() {
        return `${this.noteName}-${this.videoId}`;
    }
}

// For testing
export const dummyNoteLabels = [
    new NoteLabel('Love is War', 'c1rnPqkZVhw'),
    new NoteLabel('Platinum Disco', 'RQ0ymYGQNa8'),
    new NoteLabel('Renai Circulation', 'HUjVqf0dDJo'),
];

export function searchNotesByName(name) {
    if (!name) {
        return [];
    }

    const matchedNoteIndices = [];
    const strNoteInfos = dummyNoteLabels.map(n => n.toString().toLowerCase());
    name = name.toLowerCase();

    for (let i = 0; i < strNoteInfos.length; ++i) {
        const strInfo = strNoteInfos[i];
        if (strInfo.includes(name)) {
            matchedNoteIndices.push(i);
        }
    }

    return matchedNoteIndices.map(i => {
        return new SearchResult(
            dummyNoteLabels[i].noteName,
            dummyNoteLabels[i].videoId,
            dummyNoteLabels[i].videoId
        );
    });
}

class NoteStorageManager {
    constructor() {
        // Map of video id to note data
        const strMap = localStorage.getItem(VIDEO_ID_TO_NOTE_DATA);
        if (!strMap) {
            this.videoIdToNoteData = {};
        } else {
            this.videoIdToNoteData = JSON.parse(strMap);
        }
    }

    flushToLocalStorage = () => {
        const strJsonMap = JSON.stringify(this.videoIdToNoteData);
        localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, strJsonMap);
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
