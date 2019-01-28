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
    // localstorage itself as a key, or cache the map.
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
