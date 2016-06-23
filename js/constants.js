/* Holds system wide (read-only) global variables */

const CONSTANTS = {};

// current version for the storage structure
CONSTANTS.storageStructureVersion = 2;

// keys to skip from localStorage (the rest will be video url keys)
CONSTANTS.localStorageNonVideoKeys = new Set([
  'dropbox_js_default_credentials',
  'dropbox_userinfo',
  'video-annotation',
]);

// where do we host the webapp which fetches and shows shared annotations.
CONSTANTS.shareAppUrl = 'https://video-annotations.github.io';

export default CONSTANTS;
