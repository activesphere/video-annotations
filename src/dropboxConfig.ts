const dropboxConfig = {
  defaultAccessToken: process.env.REACT_APP_DROPBOX_ACCESS_TOKEN,

  // Path to the folder where the notes folder will be created (or used if it's already present)
  notesFolderParent: '/',

  // Name of the notes folder
  notesFolderName: 'vid-annot-notes',

  // Number of concurrent downloads of note files to download from dropbox
  downloadsPerBatch: parseInt(process.env.REACT_APP_DROPBOX_DOWNLOADS_PER_BATCH || '4'),
};

// Dropbox expects root folder path to be specified as empty string.
if (dropboxConfig.notesFolderParent === '/') {
  dropboxConfig.notesFolderParent = '';
}

if (isNaN(dropboxConfig.downloadsPerBatch) || !dropboxConfig.downloadsPerBatch) {
  dropboxConfig.downloadsPerBatch = 1;
}

export default dropboxConfig;
