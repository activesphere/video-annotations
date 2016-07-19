
/* global chrome */

function AppStorage(options) {
  this.name = options.name;
}

AppStorage.prototype.save = function saveFn(jsonData) {
  this.set(jsonData, () => {});
};

AppStorage.prototype.set = function setFn(data, callback) {
  const opt = {};
  opt[this.name] = data;
  chrome.storage.local.set(opt, () => callback());
};

AppStorage.prototype.get = function getFn(callback) {
  chrome.storage.local.get(this.name, (items) => {
    if (items && items[this.name]) {
      try {
        return callback(items[this.name]);
      } catch (error) {
        return error;
      }
    }

    return callback(null);
  });
};

export default AppStorage;
