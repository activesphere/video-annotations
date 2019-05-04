// Functions for storing notes to dropbox
import { Dropbox } from 'dropbox';
import readBlobAsString from './utils/readBlobAsString';
import pathJoin from './utils/pathJoin';
import dropboxConfig from './dropboxConfig';

const NOTES_FOLDER_PATH = pathJoin(dropboxConfig.notesFolderParent, dropboxConfig.notesFolderName);

let dbx;

export const isInitialized = () => !!dbx;

export const save = async noteData => {
    if (!dbx) {
        console.log('dropbox was not initialized. so not saving.');
        return null;
    }

    if (!noteData.videoId || !noteData.videoTitle) {
        console.warn('No videoId or videoTitle given');
        return null;
    }

    // Using the videoId itself as the file name. Will make it difficult to find the note by
    // hand (not a likely scenario for the end user, just mentioning anyway).
    const fileName = noteData.videoId;

    const filePath = pathJoin(NOTES_FOLDER_PATH, fileName);
    const writeMode = { '.tag': 'overwrite' };

    return dbx.filesUpload({
        contents: JSON.stringify(noteData),
        mode: writeMode,
        path: filePath,
        autorename: false,
    });
};

export const batchDownloadNotes = async (notePaths, promiseFn) => {
    const { downloadsPerBatch } = dropboxConfig;

    while (notePaths.length !== 0) {
        const sliceLength = Math.min(downloadsPerBatch, notePaths.length);
        const promises = notePaths.slice(0, sliceLength).map(promiseFn);
        await Promise.all(promises);
        notePaths = notePaths.slice(sliceLength);
    }
};

export const downloadAllNoteFiles = async () => {
    if (!isInitialized()) {
        console.warn('Dropbox NOT initialized.');
        return undefined;
    }

    // Assumes notes folder already exists
    const listFolderResult = await dbx.filesListFolder({
        path: NOTES_FOLDER_PATH,
        recursive: true,
    });

    const notePaths = listFolderResult.entries
        .filter(x => x['.tag'] === 'file')
        .map(entry => {
            return entry.path_display;
        });

    console.log('notePaths =', notePaths);

    const contentList = [];

    await batchDownloadNotes(notePaths, async path => {
        console.log('downloading note', path);
        const downloadInfo = await dbx.filesDownload({ path });
        const { fileBlob } = downloadInfo;
        const content = await readBlobAsString(fileBlob);
        contentList.push(content);
    });

    return contentList;
};

export const initDropboxHelper = async accessToken => {
    const client = new Dropbox({ accessToken, clientId: process.env.REACT_APP_DROPBOX_KEY });

    dbx = client;

    const { entries } = await dbx.filesListFolder({ path: dropboxConfig.notesFolderParent });

    const notesFolderExists = entries.some(
        entry => entry.name === dropboxConfig.notesFolderName && entry['.tag'] === 'folder'
    );

    if (!notesFolderExists) {
        const folderMetadata = await dbx.filesCreateFolder({ path: NOTES_FOLDER_PATH });
    }
};
