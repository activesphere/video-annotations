var video_app = video_app || {};

(function(_) {
	console.log("Url: ", chrome.extension.getURL('templates.html'));
	//decelcngdojdjceagfcjklgpfdhdmenf
	$.get(chrome.extension.getURL('templates.html'),
		function(data, textStatus, jqXHR){
		$(body).append(data);
		$('video').parents('.player-api').append($('#video-main-template').html());
		app_view = new video_app.appView();
		app_view.render();

		var currentSearch = window.location.search;
		setInterval(function() {
			if (window.location.search !== currentSearch) {
				currentSearch = window.location.search;
				console.log("loca: ", app_view);
				app_view.getVideoKey();
				app_view.fetch();
			}
		}, 1000);
	}, 'html');

	console.log('Success');
})(_);