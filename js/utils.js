var Utils = {};

(function() {
	Utils.minuteSeconds = function (time){
		if (time != null){
			minutes = Math.floor(time / 60);
			seconds = time - minutes * 60;
			time = minutes + '.' + seconds;
		}
		return time;
	};

	Utils.hosts = (function(){
		return {
			"www.youtube.com": "youtube"
		}
	})();
})();
