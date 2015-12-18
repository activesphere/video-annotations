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
	}, 'html');

	console.log('Success');
})(_);