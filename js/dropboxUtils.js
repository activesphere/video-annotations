function DropboxFile(options) {
  this.dropboxObj = options.dropboxObj;
  this.name = options.name;
}

DropboxFile.prototype.write = function dbWrite(jsonData, callback) {
  const jsonString = JSON.stringify(jsonData);
  this.dropboxObj.client((client) => {
    if (client.isAuthenticated()) {
      this.dropboxObj.userInfo();
      client.writeFile(`${this.name}.json`, jsonString, () => {
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

DropboxFile.prototype.read = function dbRead(callback) {
  this.dropboxObj.client((client) => {
    if (client.isAuthenticated()) {
      this.dropboxObj.userInfo();
      client.readFile(`${this.name}.json`, (error, data) => {
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

DropboxFile.prototype.makeUrl = function dbMakeUrl(callback) {
  this.dropboxObj.client((client) => {
    if (client.isAuthenticated()) {
      this.dropboxObj.userInfo();
      const options = { downloadHack: true };
      client.makeUrl(`${this.name}.json`, options, (error, data) => {
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
