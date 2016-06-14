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

export default CONSTANTS;
