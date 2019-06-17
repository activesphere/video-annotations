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
        return null;
    }

    if (!noteData.videoId) {
        // console.warn('No videoId or videoTitle given');
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

const batchDownloadNotes = async (notePaths, promiseFn) => {
    const { downloadsPerBatch } = dropboxConfig;

    while (notePaths.length !== 0) {
        const sliceLength = Math.min(downloadsPerBatch, notePaths.length);
        const promises = notePaths.slice(0, sliceLength).map(promiseFn);
        await Promise.all(promises);
        notePaths = notePaths.slice(sliceLength);
    }
};

export const downloadNotes = async () => {
    if (!isInitialized()) {
        console.warn('Dropbox NOT initialized.'); // eslint-disable-line no-console
        return;
    }

    const listFolderResult = await dbx.filesListFolder({
        path: NOTES_FOLDER_PATH,
        recursive: true,
    });

    const notePaths = listFolderResult.entries
        .filter(x => x['.tag'] === 'file')
        .map(entry => entry.path_display);

    const contentList = [];

    await batchDownloadNotes(notePaths, async path => {
        // console.log('downloading note', path);
        const downloadInfo = await dbx.filesDownload({ path });
        const { fileBlob } = downloadInfo;
        const content = await readBlobAsString(fileBlob);
        contentList.push(content);
    });

    return contentList;
};

export const init = async accessToken => {
    const client = new Dropbox({
        accessToken,
        clientId: process.env.REACT_APP_DROPBOX_KEY,
        fetch: window.fetch,
    });

    dbx = client;

    const { entries } = await dbx.filesListFolder({ path: dropboxConfig.notesFolderParent });

    const notesFolderExists = entries.some(
        entry => entry.name === dropboxConfig.notesFolderName && entry['.tag'] === 'folder'
    );

    if (!notesFolderExists) {
        await dbx.filesCreateFolder({ path: NOTES_FOLDER_PATH });
    }
};
