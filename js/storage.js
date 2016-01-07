var video_app = video_app || {};
(function(video_app) {
	var AppStorage = function(options){
		this.name = options.name;
	}

	AppStorage.prototype.save = function(collection){
		var json_data = [], opt = {};
		var models = collection.models;
		json_data = _.map(models, function(model){ return model.toJSON(); });
		this.set(json_data, function(){});
	}

	AppStorage.prototype.set = function(data, callback){
		var opt = {};
		var self = this;
		opt[this.name] = data;
		chrome.storage.local.set(opt, function() {
			console.log('Data Saved');
			callback();
		});
	}

	AppStorage.prototype.get = function(callback){
		chrome.storage.local.get(this.name, (function(_this) {
			return function(items){
				if (items && items[_this.name]) {
					try {
						return callback(items[_this.name]);
					} catch (error){

					}
				} else {
				}

				return callback(null);
			};
		})(this));
	}

	video_app.AppStorage = AppStorage;
})(video_app);