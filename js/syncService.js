import _ from 'lodash';
import Promise from 'bluebird';
import Utils from './utils';
import CONSTANTS from './constants';

function promisify(fn) {
  return new Promise((resolve, reject) =>
    fn((err, res) => {
      if (err) {
        if (err instanceof Error) {
          reject(err);
        } else {
          reject(Error(err));
        }
      } else {
        resolve(res);
      }
    }));
}

function promisifyStd(fn) {
  return new Promise((resolve) =>
    fn((res) => {
      resolve(res);
    }));
}

export function creatingURL(dropboxFile) {
  return promisify(dropboxFile.makeUrl.bind(dropboxFile))
    .catch(() => []);
}

function readingDropbox(dropboxFile) {
  return promisify(dropboxFile.read.bind(dropboxFile))
  .catch(() => []);
}

function readingStorage(localStorage) {
  return promisifyStd(localStorage.get.bind(localStorage));
}

// data-structure migration specific code
function migrateToStorageV2(oldStructure) {
  // oldStructure is supposed to be an array of objects (annotations)
  const now = new Date().toString();
  let metadata = {
    creationTime: now,
    lastUpdate: now,
  };

  const host = Utils.hosts[window.location.hostname];
  const pagedata = Utils.getVideoInfo(host);
  metadata = _.merge(metadata, pagedata);

  const newStructure = {
    annotations: oldStructure,
    metadata,
  };
  return newStructure;
}

// Exported for testing
export function merge(sources, local, initialSync) {
  let storageData = _.cloneDeep(sources[1]);
  let dropboxData = sources[0];

  if (_.isEmpty(local) && _.isEmpty(storageData) && _.isEmpty(dropboxData)) {
    throw Error('No annotations on this video to sync');
  }

  if (!initialSync) {
    return { annotations: local,
             metadata: null };
  }

  // check for storageData and dropboxData if they are using
  // old structure where base64Url -> arrayOf(annotations) exist
  if (storageData && storageData instanceof Array) {
    storageData = migrateToStorageV2(storageData);
  }

  if (dropboxData && dropboxData instanceof Array) {
    dropboxData = migrateToStorageV2(dropboxData);
  }

  if (_.isEmpty(storageData)) {
    return dropboxData;
  }

  const merged = _.map(dropboxData.annotations, (record) => {
    const storageIdx = storageData.annotations.findIndex(
      (d) => d.id === record.id
    );
    if (storageIdx > -1) {
      return storageData.annotations.splice(storageIdx, 1)[0];
    }

    return record;
  });

  storageData.annotations = merged.concat(storageData.annotations);
  return storageData;
}

function syncingData(localStorage, dropboxFile, state, initialSync) {
  return Promise
    .all([readingDropbox(dropboxFile), readingStorage(localStorage)])
    .then((data) =>
      merge(data, state.annotations.slice(), initialSync)
    )
    .then((jsonData) => {
      if (!initialSync) jsonData.metadata = state.metadata;
      jsonData.storageVersion = CONSTANTS.storageStructureVersion;

      localStorage.save(jsonData);
      dropboxFile.write(jsonData);

      return jsonData;
    })
    .catch((err) => err);
}

export const syncOnChange =
(prevState, currState, storage, dropboxFile) => {
  // Don't need to sync up on UI state changes
  if (prevState &&
      prevState.searchQuery === currState.searchQuery &&
      prevState.helpMessageShown === currState.helpMessageShown) {
    const localState = {
      annotations: currState.notes,
      metadata: currState.metadata,
    };
    syncingData(
      storage,
      dropboxFile,
      localState
    );
  }
};

export default syncingData;
