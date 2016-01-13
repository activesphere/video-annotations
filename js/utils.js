var Utils = {};

(function() {
	Utils.minuteSeconds = function (time){
		if (time != null){
			minutes = Math.floor(time / 60);
			seconds = Math.floor(time - (minutes * 60));
			time = minutes + '.' + seconds;
		}
		return time;
	};

	Utils.hosts = (function(){
		return {
			"www.youtube.com": "youtube"
		}
	})();

	Utils.splitAnnotation = function(annotation){
		var list = annotation.split('\n');
		var title = list.shift();
		var description = _.compact(list).join('\n');
		return {title: title, description: description, annotation: annotation};
	};

	Utils.userInfo = 'dropbox_userinfo';
})();
