// Functions for storing notes to dropbox
import { pathJoin, readBlobAsString } from './utils';
import { dropboxConfig } from './userConfig';
import { noteNameFromIdAndTitle } from './NoteData';

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

        const fileName = noteNameFromIdAndTitle(noteData.videoId, noteData.videoTitle);
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

        // Download each.
        const downloadResultPromises = [];
        for (const noteFileName of noteFileNames) {
            const path = pathJoin(NOTES_FOLDER_PATH, noteFileName);
            const p = this.dbx.filesDownload({ path });
            downloadResultPromises.push(p);
        }

        const downloadInfos = await Promise.all(downloadResultPromises);

        const notesByVideoId = {};

        for (const info of downloadInfos) {
            const { fileBlob } = info;
            const fileContent = await readBlobAsString(fileBlob);
            const contentAsJson = JSON.parse(fileContent);
            notesByVideoId[contentAsJson.videoId] = contentAsJson;
        }
        return notesByVideoId;
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
