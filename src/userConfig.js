const keyMap = {
    'control+p': 'togglePause',
    'control+t': 'putTimestamp',
    'control+s': 'saveNote',
    'control+shift+right': 'videoForward',
    'control+shift+left': 'videoBackward',
    'control+shift+s': 'saveToDropbox' // Saves to both local storage and dropbox. Just mentioning.
};

const dropboxConfig = {
    defaultAccessToken: process.env.REACT_APP_DROPBOX_SOUMIKS_ACCESS_TOKEN,

    // Path to the folder where the notes folder will be created (or used if it's already present)
    notesFolderParent: '/',

    // Name of the notes folder
    notesFolderName: 'vid-annot-notes',
};

// Dropbox expects root folder path to be specified as empty string.
if (dropboxConfig.notesFolderParent === '/') {
    dropboxConfig.notesFolderParent = '';
}

export { keyMap, dropboxConfig };
