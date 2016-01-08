var video_app = video_app || {};
(function(video_app) {
	var DropboxFile = function(options){
		this.dropboxObj = options.dropboxObj;
		this.name = options.name
	}

	DropboxFile.prototype.write = function(json_data, callback){
		var _this = this;
		json_string = JSON.stringify(json_data);
		this.dropboxObj.client(function(client){
			if (client.isAuthenticated()) {
				_this.dropboxObj.userInfo();
				client.writeFile(_this.name+'.json', json_string, function(){
					console.log('Data saved in dropbox');
					if ( callback ) {
						callback();
					}
				});
			} else {
				console.log('Write: Not authendicated');
				if ( callback ) {
					callback();
				}
			}
		});
	}

	DropboxFile.prototype.read = function(callback){
		var _this = this;
		this.dropboxObj.client(function(client){
			if (client.isAuthenticated()) {
				_this.dropboxObj.userInfo();
				client.readFile(_this.name+'.json', function(error, data){
					if (error) {
						if (error.status == 404) {
							return {}
						}
					} else {
						callback(null, JSON.parse(data));
					}
				});
			} else {
				callback(true, {});
			}
		});
	}

	video_app.DropboxFile = DropboxFile;
})(video_app);