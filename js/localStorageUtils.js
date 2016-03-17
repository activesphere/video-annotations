function AppStorage(options) {
  this.name = options.name;
}

AppStorage.prototype.save = function (jsonData) {
  this.set(jsonData, function () {});
};

AppStorage.prototype.set = function (data, callback) {
  var opt = {};
  opt[this.name] = data;
  chrome.storage.local.set(opt, function () {
    callback();
  });
};

AppStorage.prototype.get = function (callback) {
  chrome.storage.local.get(this.name, (function (_this) {
    return function (items) {
      if (items && items[_this.name]) {
        try {
          return callback(items[_this.name]);
        } catch (error) {

        }
      }

      return callback(null);
    };
  })(this));
};

export default AppStorage;
