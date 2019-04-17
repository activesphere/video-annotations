import dropboxHelper from './dropboxHelper';

// localStorage key for the full JSON object we are storing which contains *all* notes. Notes will
// be keyed by video id.
const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

// We cache the whole id to note-data map as a a JS object. We pass it around, store note data into it,
// and flush it to local storage on route change or window close.
let cachedIdToNoteData = undefined;

export function readMapFromLocalStorage() {
    const strMap = localStorage.getItem(VIDEO_ID_TO_NOTE_DATA);
    if (!strMap) {
        cachedIdToNoteData = {};
    } else {
        cachedIdToNoteData = JSON.parse(strMap);
    }
    return cachedIdToNoteData;
}

const idToNoteData = readMapFromLocalStorage();

export { idToNoteData };

export function loadNoteWithId(idToNoteData, videoId) {
    const key = videoId;
    const noteData = idToNoteData[key];
    if (!noteData) {
        console.log('No note for videoId', key);
        return {};
    }
    return noteData;
}

export function deleteNoteWithId(idToNoteData, videoId) {
    if (!videoId) {
        console.warn('videoId was undefined');
        return;
    }

    const key = videoId;
    if (idToNoteData[key]) {
        delete idToNoteData[key];
        flushToLocalStorage(idToNoteData);
        console.log('Deleted note for video', videoId);
    } else {
        console.log('No note for video ', videoId);
    }
}

export function cacheNoteWithId(idToNoteData, videoId, noteData) {
    if (!videoId) {
        console.warn('videoId was undefined');
        return;
    }

    const key = videoId;
    idToNoteData[key] = noteData;
    console.log('Cached note for video ', noteData.videoTitle);
}

export function saveNoteWithId(idToNoteData, videoId, noteData) {
    if (!videoId) {
        console.warn('video id was undefined');
        return;
    }

    const key = videoId;
    idToNoteData[key] = noteData;
    console.log('Saved note for video', noteData.videoTitle);
    flushToLocalStorage(idToNoteData);
}

export function flushToLocalStorage(idToNoteData) {
    const strJsonMap = JSON.stringify(idToNoteData);
    localStorage.setItem(VIDEO_ID_TO_NOTE_DATA, strJsonMap);
    console.log('Flushed to local storage');
}

export function getNoteMenuItems(idToNoteData) {
    const keys = Object.keys(idToNoteData);
    const items = [];

    // For each note, return the video name as the label and videoId as the value.
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];

        if (idToNoteData.hasOwnProperty(key)) {
            const noteData = idToNoteData[key];

            // react-select requires the label will appear on the item and the associated value.
            items.push({
                label: noteData.videoTitle,
                value: noteData.videoId,
            });
        }
    }
    return items;
}

export function getNoteMenuItemsForCards(idToNoteData) {
    const keys = Object.keys(idToNoteData);
    const cardInfos = [];

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];

        if (idToNoteData.hasOwnProperty(key)) {
            const noteData = idToNoteData[key];

            // TODO: Send a 'shortened' text of the contents of the card too.
            cardInfos.push({
                videoTitle: noteData.videoTitle,
                videoId: noteData.videoId,
            });
        }
    }
    return cardInfos;
}

const DROPBOX_MAX_UPLOADS_PER_BATCH = 4;

// Update dropbox file or localstorage note depending on which one is older.
export async function syncWithDropbox(idToNoteData) {
    if (!dropboxHelper.isInitialized()) {
        console.log('Not syncing localStorage with dropbox');
        return;
    }

    // Array of raw content for each file
    const contentsList = await dropboxHelper.downloadAllNoteFiles();

    const dbNoteDataById = {};

    for (const content of contentsList) {
        const noteData = JSON.parse(content);
        dbNoteDataById[noteData.videoId] = noteData;
    }

    // console.log('dbNoteDataById =', dbNoteDataById);

    // -- Correct the local storage in case we still have notes from before dropbox sync
    // implementation. Also, TODO: remove this code after a while.
    const oldNoteKeyRegex = /saved_note_(.+)/;
    const oldVideoIds = [];
    const oldKeys = [];

    Object.keys(idToNoteData).forEach(key => {
        const m = oldNoteKeyRegex.exec(key);
        if (m) {
            oldKeys.push(key);
            oldVideoIds.push(m[1]);
        }
    });

    for (let i = 0; i < oldKeys.length; ++i) {
        const oldKey = oldKeys[i];
        const oldVideoId = oldVideoIds[i];

        const oldNoteData = idToNoteData[oldKey];
        oldNoteData.timeOfSave = 0;

        idToNoteData[oldVideoId] = oldNoteData;
        delete idToNoteData[oldKey];
    }

    // -- End of correction related code.

    // Upload notes that are newer in local storage
    const promisesOfUploadingNotes = [];

    for (const videoId of Object.keys(idToNoteData)) {
        const lsNoteData = idToNoteData[videoId];
        const dbNoteData = dbNoteDataById[videoId];

        // console.log('lsNoteData =', lsNoteData);
        // console.log('dbNoteData =', dbNoteData);

        if (!dbNoteData || dbNoteData.timeOfSave < lsNoteData.timeOfSave) {
            if (promisesOfUploadingNotes.length < DROPBOX_MAX_UPLOADS_PER_BATCH) {
                promisesOfUploadingNotes.push(dropboxHelper.save(lsNoteData));
            } else {
                await Promise.all(promisesOfUploadingNotes);
                promisesOfUploadingNotes.length = 0;
            }
            console.log(`Updating Dropbox for note ${videoId}, title - ${lsNoteData.videoTitle}`);
        }
    }

    // Wait for all the notes to upload.
    await Promise.all(promisesOfUploadingNotes);

    // Do the same in the other direction. If there's files in dropbox but not in localstorage or there's
    // a note with same id but time of save is older in localstorage than that in dropbox,
    // overwrite localstorage's content.
    let updatedLocalMap = false;
    for (const videoId of Object.keys(dbNoteDataById)) {
        const dbNoteData = dbNoteDataById[videoId];
        const lsNoteData = idToNoteData[videoId];
        // console.log('dbNoteData =', dbNoteData);
        if (!lsNoteData || lsNoteData.timeOfSave < dbNoteData.timeOfSave) {
            updatedLocalMap = true;
            idToNoteData[videoId] = dbNoteData;
            console.log(
                `Updating localstorage for note ${videoId}, title - ${dbNoteData.videoTitle}`
            );
        }
    }

    if (updatedLocalMap) {
        flushToLocalStorage(idToNoteData);
    }
}
