import { save as saveNoteDbx, isInitialized, downloadAllNoteFiles } from './DropboxHelper';
import unique from './utils/unique';

// localStorage key for the full JSON object we are storing which contains *all* notes. Notes will
// be keyed by video id.
const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

// We cache the whole id to note-data map as a a JS object. We pass it around, store note data into it,
// and flush it to local storage on route change or window close.
const readMapFromLocalStorage = () => {
    const strMap = localStorage.getItem(VIDEO_ID_TO_NOTE_DATA);

    return strMap ? JSON.parse(strMap) : {};
};

const idToNoteData = readMapFromLocalStorage();

export { idToNoteData };

export const loadNoteWithId = videoId => idToNoteData[videoId] || {};

export const deleteNoteWithId = videoId => {
    if (!idToNoteData[videoId]) return;

    delete idToNoteData[videoId];
    flushToLocalStorage(idToNoteData);
};

export const saveNoteWithId = (videoId, noteData) => {
    if (!videoId) return;

    idToNoteData[videoId] = noteData;
    flushToLocalStorage(idToNoteData);
};

export const flushToLocalStorage = idToNoteData => {
    localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, JSON.stringify(idToNoteData));
};

export const getNoteMenuItemsForCards = () => Object.values(idToNoteData);

const DROPBOX_UPLOAD_BATCH_LIMIT = 4;

const batchDropboxUpload = async (notes, promiseFn, limit) => {
    console.log('Notes to upload =', notes);
    let remaining = [...notes];
    while (remaining.length) {
        const sliceLength = Math.min(limit, remaining.length);
        const promises = remaining.slice(0, sliceLength).map(promiseFn);
        await Promise.all(promises);
        remaining = remaining.slice(sliceLength);
    }
};

// Update dropbox file or localstorage note depending on which one is older.
export async function syncWithDropbox() {
    if (!isInitialized()) {
        console.warn('Dropbox is not initialized while syncWithDropbox is called.');
        return;
    }

    const contentsList = await downloadAllNoteFiles();

    const dbxNotes = contentsList.map(x => JSON.parse(x));

    // Notes to be uploaded
    const uploadNotes = [];

    const keys = unique([...Object.keys(idToNoteData), ...dbxNotes.map(x => x.videoId)]);

    for (const videoId of keys) {
        const lsData = idToNoteData[videoId];
        const dbxData = dbxNotes.find(x => x.videoId === videoId);

        if (lsData && (!dbxData || dbxData.timeOfSave < lsData.timeOfSave)) {
            uploadNotes.push(lsData);
        }

        if (dbxData && (!lsData || lsData.timeOfSave < dbxData.timeOfSave)) {
            idToNoteData[videoId] = dbxData;
        }
    }

    await batchDropboxUpload(uploadNotes, saveNoteDbx, DROPBOX_UPLOAD_BATCH_LIMIT);
    flushToLocalStorage(idToNoteData);
}
