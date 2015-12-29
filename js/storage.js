var video_app = video_app || {};
(function(video_app) {
	var AppStorage = function(options){
		this.name = options.name;
	}

	AppStorage.prototype.save = function(collection){
		var json_data = [], opt = {};
		var models = collection.models;
		json_data = _.map(models, function(model){ return model.toJSON(); });
		opt[this.name] = json_data
		chrome.storage.local.set(opt, function() {
			console.log('Data saved');
		});
	}

	AppStorage.prototype.get = function(callback){
		chrome.storage.local.get(this.name, (function(_this) {
			return function(collection){
				annotations = collection[_this.name] || [];
				return callback(annotations);
			};
		})(this));
	}

	video_app.AppStorage = AppStorage;
})(video_app);