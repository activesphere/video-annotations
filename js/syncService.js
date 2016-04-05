import _ from 'lodash';
import Promise from 'bluebird';

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

// Exported for testing
export function merge(sources, local, initialSync) {
  var storageData = _.cloneDeep(sources[1]);
  var dropboxData = sources[0];

  if (_.isEmpty(local) && _.isEmpty(storageData) && _.isEmpty(dropboxData)) {
    throw Error('No annotations on this video to sync');
  }

  if (!initialSync) {
    return local;
  }

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
  return Promise.all([readingDropbox(dropboxFile), readingStorage(localStorage)]).then((data) =>
    merge(data, _.map(collection.models, (model) => model.toJSON()), initialSync)
  ).then((jsonData) => {
    if (initialSync) {
      collection.set(jsonData, { silent: true });
    }

    localStorage.save(jsonData);
    dropboxFile.write(jsonData);
  }).catch((err) => {
    console.error(err);
  });
};

export default syncingData;
