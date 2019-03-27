// Functions for storing notes to dropbox
import { readBlobAsString } from './utils';
import pathJoin from './utils/pathJoin';
import dropboxConfig from './dropboxConfig';

const NOTES_FOLDER_PATH = pathJoin(
    dropboxConfig.notesFolderParent === '/' ? '' : dropboxConfig.notesFolderParent,
    dropboxConfig.notesFolderName
);

// Helper class for saving and retrieving notes from dropbox.
class DropboxHelper {
    // TODO: Remove this ctor altogether
    constructor(notesFolderPath = NOTES_FOLDER_PATH) {
        this.dbx = undefined;
        this.notesFolderPath = notesFolderPath;
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
    async save(noteData) {
        if (!this.dbx) {
            console.log('dropbox was not initialized. so not saving.');
            return undefined;
        }

        if (!noteData.videoId || !noteData.videoTitle) {
            console.warn('No videoId or videoTitle given');
            return undefined;
        }

        // Using the videoId itself as the file name. Will make it difficult to find the note by
        // hand (not a likely scenario for the end user, just mentioning anyway).
        const fileName = noteData.videoId;

        const filePath = pathJoin(this.notesFolderPath, fileName);
        const writeMode = { '.tag': 'overwrite' };

        return this.dbx.filesUpload({
            contents: JSON.stringify(noteData),
            mode: writeMode,
            path: filePath,
            autorename: false,
        });
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

        const noteFileNames = [];

        for (let entry of listFolderResult.entries) {
            if (entry['.tag'] !== 'file') {
                continue;
            }
            noteFileNames.push(entry.name);
        }

        const contentList = [];

        const { downloadsPerBatch } = dropboxConfig;
        const numFiles = noteFileNames.length;

        console.log('downloadsPerBatch =', downloadsPerBatch);

        for (
            let filesDownloaded = 0;
            filesDownloaded < numFiles;
            filesDownloaded += downloadsPerBatch
        ) {
            // Download each file this batch.
            const downloadResultPromises = [];

            for (
                let i = filesDownloaded, e = Math.min(i + downloadsPerBatch, numFiles);
                i < e;
                ++i
            ) {
                const noteFileName = noteFileNames[i];
                const path = pathJoin(NOTES_FOLDER_PATH, noteFileName);
                const p = this.dbx.filesDownload({ path });
                downloadResultPromises.push(p);
            }

            const downloadInfos = await Promise.all(downloadResultPromises);

            for (const info of downloadInfos) {
                const { fileBlob } = info;
                const content = await readBlobAsString(fileBlob);
                contentList.push(content);
            }
        }

        return contentList;
    }
}

// The helper object. Keeping it as a global.
const dropboxHelper = new DropboxHelper();
export default dropboxHelper;

// Creates the notes folder after dropbox has authorized us
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

    // Initialize the helper. From now on we will be using this object to save and get notes.
    dropboxHelper.init(dbx, NOTES_FOLDER_PATH);
}

export { initDropboxHelper };
