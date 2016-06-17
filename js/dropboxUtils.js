var DropboxFile = function (options) {
  this.dropboxObj = options.dropboxObj;
  this.name = options.name;
};

DropboxFile.prototype.write = function (jsonData, callback) {
  var _this = this;
  var jsonString = JSON.stringify(jsonData);
  this.dropboxObj.client(function (client) {
    if (client.isAuthenticated()) {
      _this.dropboxObj.userInfo();
      client.writeFile(_this.name + '.json', jsonString, function () {
        if (callback) {
          callback();
        }
      });
    } else {
      if (callback) {
        callback();
      }
    }
  });
};

DropboxFile.prototype.read = function (callback) {
  var _this = this;
  this.dropboxObj.client(function (client) {
    if (client.isAuthenticated()) {
      _this.dropboxObj.userInfo();
      client.readFile(_this.name + '.json', function (error, data) {
        if (error) {
          if (error.status === 404) {
            callback(error, []);
          }
        } else {
          callback(false, JSON.parse(data));
        }
      });
    } else {
      callback({ status: 403 }, []);
    }
  });
};

DropboxFile.prototype.makeUrl = function (callback) {
  this.dropboxObj.client((client) => {
    if (client.isAuthenticated()) {
      this.dropboxObj.userInfo();
      const options = { downloadHack: true };
      client.makeUrl(this.name + '.json', options, function (error, data) {
        if (error) {
          if (error.status === 404) {
            callback(error, []);
          }
        } else {
          callback(false, data.url);
        }
      });
    } else {
      callback({ status: 403 }, []);
    }
  });
};

export default DropboxFile;
