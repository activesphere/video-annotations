import _ from 'lodash';
import Promise from 'bluebird';
import Utils from './utils';
import CONSTANTS from './constants';

function promisify(fn) {
  return new Promise((resolve, reject) =>
    fn(function (err, res) {
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
    fn(function (res) {
      resolve(res);
    }));
}

var readingDropbox = function (dropboxFile) {
  return promisify(dropboxFile.read.bind(dropboxFile))
  .catch(() => []);
};

var readingStorage = function (localStorage) {
  return promisifyStd(localStorage.get.bind(localStorage));
};

// data-structure migration specific code
const migrateToStorageV2 = function (oldStructure) {
  // oldStructure is supposed to be an array of objects (annotations)  
  const now = new Date().toString();
  let metadata = {
    creationTime: now,
    lastUpdate: now,
  };
  
  let host = Utils.hosts[window.location.hostname];
  let pagedata = Utils.getVideoInfo(host);
  metadata = _.merge(metadata, pagedata);
  
  const newStructure = {
    annotations: oldStructure,
    metadata: metadata,
  };
  return newStructure;
};

// Exported for testing
export function merge(sources, local, initialSync) {
  var storageData = _.cloneDeep(sources[1]);
  var dropboxData = sources[0];

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

  var merged = _.map(dropboxData.annotations, (record) => {
    var storageIdx = _.findIndex(storageData.annotations, (d) => d.id === record.id);
    if (storageIdx > -1) {
      record = storageData.annotations.splice(storageIdx, 1)[0];
    }
    
    return record;
  });

  //return merged.concat(storageData['annotations']);
  storageData.annotations = merged.concat(storageData.annotations);
  return storageData;
}

var syncingData = function (localStorage, dropboxFile, collection, initialSync) {
  return Promise.all([readingDropbox(dropboxFile), readingStorage(localStorage)]).then((data) =>
    merge(data, _.map(collection.models, (model) => model.toJSON()), initialSync)
  ).then((jsonData) => {
    if (initialSync) {
      collection.set(jsonData.annotations, { silent: true });
      collection.metadata = jsonData.metadata;
    }

    jsonData.metadata = collection.metadata;
    jsonData.storageVersion = CONSTANTS.storageStructureVersion;
    
    localStorage.save(jsonData);
    dropboxFile.write(jsonData);
  }).catch((err) => {
    console.error(err);
  });
  
};

export default syncingData;
