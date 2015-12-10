var video_app = video_app || {};
var ENTER_KEY = 13;
var video_tag = $('video')[0];

(function() {
	//Inject backbone templates to DOM
	$.get(chrome.extension.getURL('templates.html'), function(data, textStatus, jqXHR){
		$(body).append(data);
		console.log('rendered');
	}, 'html');

	var app_template = "<div id='video-annotations'>\
												<div id='new_annotation'></div>\
												<div id='annotations_list'></div>\
											</div>";

	// //Trigger Ctrl + n
	function triggerEvents(e) {
		var evtobj = window.event? event : e
		//Control + E to annota b/w start and end
		if (evtobj.keyCode == 69 && evtobj.ctrlKey){
			video_tag.pause();
			new_video_view.render();
		//Control + S to start from that frame
		} else if (evtobj.keyCode == 83 && evtobj.ctrlKey){
			if(new_video_view && video_tag)
				new_video_view.start_seconds = parseInt(video_tag.currentTime);
			//Control + D to do quick annotation for that frame
		} else if (evtobj.keyCode == 68 && evtobj.ctrlKey){
			if(new_video_view && video_tag){
				video_tag.pause();
				new_video_view.that_seconds = true;
				new_video_view.render();
			}
		}
	}

	function getVideoId(){
		var current_url = window.location;
		query={};
		current_url.search.split('?')[1].split('&').forEach(function(i){query[i.split('=')[0]]=i.split('=')[1];});
		video_id = query['v']
	}

	//Keyup events
	document.onkeydown = triggerEvents;
	//Get Video Id
	getVideoId();

	//Inject template to DOM
	$('video').parent().append(app_template);
	//Create new annotation
	var new_video_view = new video_app.newAnnotationView()

	//Load annotations
	annotations_view = new video_app.annotationsView({collection: video_app.Annotations});
	annotations_view.render();

	function renderStatus(statusText) {
		console.log('Success');
	}

	renderStatus('refresh');
})();