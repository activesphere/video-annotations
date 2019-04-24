// Functions for storing notes to dropbox
import readBlobAsString from './utils/readBlobAsString';
import pathJoin from './utils/pathJoin';
import dropboxConfig from './dropboxConfig';

const NOTES_FOLDER_PATH = pathJoin(dropboxConfig.notesFolderParent, dropboxConfig.notesFolderName);

// Helper class for saving and retrieving notes from dropbox.
class DropboxHelper {
    // TODO: Remove this ctor altogether
    constructor() {
        this.dbx = undefined;
    }

    // Will be initialized after we complete setting up dropbox.
    init(dbx) {
        console.assert(!!dbx);
        this.dbx = dbx;
    }

    isInitialized() {
        return !!this.dbx;
    }

    // Save given editor value. We currently store only the JSON representation of the note.
    // TODO: store plain text representation alongside it.
    save = async noteData => {
        if (!this.dbx) {
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

        return this.dbx.filesUpload({
            contents: JSON.stringify(noteData),
            mode: writeMode,
            path: filePath,
            autorename: false,
        });
    };

    async batchDownloadNotes(notePaths, promiseFn) {
        const { downloadsPerBatch } = dropboxConfig;

        while (notePaths.length !== 0) {
            const sliceLength = Math.min(downloadsPerBatch, notePaths.length);
            const promises = notePaths.slice(0, sliceLength).map(promiseFn);
            await Promise.all(promises);
            notePaths = notePaths.slice(sliceLength);
        }
    }

    async downloadAllNoteFiles() {
        if (!this.isInitialized()) {
            console.warn('Dropbox NOT initialized.');
            return undefined;
        }

        // Assumes notes folder already exists
        const listFolderResult = await this.dbx.filesListFolder({
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

        await this.batchDownloadNotes(notePaths, async path => {
            console.log('downloading note', path);
            const downloadInfo = await this.dbx.filesDownload({ path });
            const { fileBlob } = downloadInfo;
            const content = await readBlobAsString(fileBlob);
            contentList.push(content);
        });

        return contentList;
    }
}

const dropboxHelper = new DropboxHelper();
export default dropboxHelper;

async function initDropboxHelper(dbx) {
    console.log('Dropbox notes folder path =', NOTES_FOLDER_PATH);

    const { entries } = await dbx.filesListFolder({ path: dropboxConfig.notesFolderParent });
    const notesFolderExists = entries.some(
        entry => entry.name === dropboxConfig.notesFolderName && entry['.tag'] === 'folder'
    );

    if (!notesFolderExists) {
        const folderMetadata = await dbx.filesCreateFolder({ path: NOTES_FOLDER_PATH });
        console.log('notes folder created =', folderMetadata.path_lower);
    } else {
        console.log('Notes folder already exists at - ', NOTES_FOLDER_PATH);
    }

    dropboxHelper.init(dbx, NOTES_FOLDER_PATH);
}

export { initDropboxHelper };
