// localStorage key for the full JSON object we are storing which contains *all* notes.
const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

// A JSON serializable object representing a full note. Kept as values in the VIDEO_ID_TO_NOTE_DATA
// map.
export class NoteData {
    constructor(videoId, jsonEditorValue) {
        this.videoId = videoId;
        this.strJsonEditorValue = JSON.stringify(jsonEditorValue);
    }
}

// Initialize maps if they don't exist
function initMap() {
    if (!localStorage.getItem(VIDEO_ID_TO_NOTE_DATA)) {
        localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, '{}');
    }
}

// Saves given NoteData
export function saveVideoNote(noteData, noteName) {
    initMap();

    if (!(noteData instanceof NoteData)) {
        console.warn('Given noteData is not a NoteData');
        return;
    }

    // Deserialize the map and set the entry and rewrite the map.
    let idToNoteData = JSON.parse(localStorage.getItem(VIDEO_ID_TO_NOTE_DATA));
    const key = `saved_note_${noteData.videoId}`;
    idToNoteData[key] = noteData;
    localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, JSON.stringify(idToNoteData));

    // TODO(rksht): (De-)serializing will slow down as number of notes or large notes increases. Use
    // localstorage itself as a key, or cache the map. This *must* be done considering we want to
    // search notes and autosave.
}

// Returns the saved editor
export function loadVideoNote(videoId) {
    initMap();

    let idToNoteData = JSON.parse(localStorage.getItem(VIDEO_ID_TO_NOTE_DATA));
    const key = `saved_note_${videoId}`;

    if (!(key in idToNoteData)) {
        console.warn('No note for video Id ');
        return undefined;
    }
    return JSON.parse(idToNoteData[key].strJsonEditorValue);
}

// Search results

export class SearchResult {
    constructor(mainText, subText, key) {
        this.mainText = mainText;
        this.subText = subText;
        this.key = key;
    }
}

class DummyNote {
    constructor(noteName, videoId) {
        this.noteName = noteName;
        this.videoId = videoId;
    }

    toString() {
        return `${this.noteName}-${this.videoId}-dummy`;
    }
}

// For testing
const dummyNotes = [
    new DummyNote('Ode to the West Wind', 'oa98kj098'),
    new DummyNote('Wuthering Heights', '8098njanwd'),
    new DummyNote('Guided Missiles', '8nawd90kwf'),
    new DummyNote('The Wanderer', '36tjcrifjrv'),
];

export function searchNotesByName(name) {
    if (!name) {
        return [];
    }

    const matchedNoteIndices = [];
    const strNoteInfos = dummyNotes.map(n => n.toString().toLowerCase());
    name = name.toLowerCase();

    for (let i = 0; i < strNoteInfos.length; ++i) {
        const strInfo = strNoteInfos[i];
        if (strInfo.includes(name)) {
            matchedNoteIndices.push(i);
        }
    }

    return matchedNoteIndices.map(i => {
        return new SearchResult(
            dummyNotes[i].noteName,
            dummyNotes[i].videoId,
            dummyNotes[i].videoId
        );
    });
}
