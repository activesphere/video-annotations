import _ from 'lodash';
import Promise from 'bluebird';

function promisify(fn) {
  return new Promise((resolve, reject) => {
    return fn(function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

function promisifyStd(fn) {
  return new Promise((resolve) => {
    return fn(function (res) {
      resolve(res);
    });
  });
}

var readingDropbox = function (dropboxFile) {
  return promisify(dropboxFile.read.bind(dropboxFile))
  .catch((error) => {
    console.error(error);
    if (error.status === 404) {
      // Create file for the first time
      dropboxFile.write([], () => syncingData);
    } else if (error.status === 403) {
      return [];
    }
  });
};

var readingStorage = function (localStorage) {
  return promisifyStd(localStorage.get.bind(localStorage));
};

// Exported for testing
export function merge(sources, local, initialSync) {
  if (!initialSync) {
    return local;
  }

  var dropboxData = sources[0];
  var storageData = _.cloneDeep(sources[1]);

  if (_.isEmpty(storageData)) {
    return dropboxData;
  }

  var merged = _.map(dropboxData, (record) => {
    var storageIdx = _.findIndex(storageData, (d) => d.id === record.id);
    if (storageIdx > -1) {
      record = storageData.splice(storageIdx, 1)[0];
    }

    return record;
  });

  return merged.concat(storageData);
}

var syncingData = function (localStorage, dropboxFile, collection, initialSync) {
  return Promise.all([readingDropbox(dropboxFile), readingStorage(localStorage)]).then((data) => {
    return merge(data, _.map(collection.models, (model) => model.toJSON()), initialSync);
  }).then((jsonData) => {
    collection.set(jsonData, { merge: true, silent: true });
    localStorage.save(jsonData);
    dropboxFile.write(jsonData);
  }).catch((err) => {
    console.error(err);
  });
};

export default syncingData;
