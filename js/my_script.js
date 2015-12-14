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
												<span class='left_arrow'>></span>\
												<div class='left_alignment hide'>\
													<div id='start_time'>\
														<span>Start Time: </span>\
														<span class='start_frame'></span>\
													</div>\
													<div id='annotations_list'></div>\
												</div>\
											</div>";

	// //Trigger Ctrl + n
	function triggerEvents(e) {
		var evtobj = window.event? event : e
		//Control + E to annota b/w start and end
		if (evtobj.keyCode == 69 && evtobj.altKey){
			video_tag.pause();
			new_video_view.render();
		//Control + S to start from that frame
		} else if (evtobj.keyCode == 83 && evtobj.altKey){
			if(new_video_view && video_tag){
				new_video_view.start_seconds = parseInt(video_tag.currentTime);
				updateStartFrame(new_video_view.start_seconds);
			}
			//Control + D to do quick annotation for that frame
		} else if (evtobj.keyCode == 68 && evtobj.altKey){
			if(new_video_view && video_tag){
				video_tag.pause();
				new_video_view.that_seconds = true;
				new_video_view.render();
				return false;
			}
		} else if (evtobj.keyCode == 87 && evtobj.altKey){
			new_video_view.clear();
			video_tag.play();
		}
	}

	function updateStartFrame(time){
		if(time != null){
			minutes = Math.floor(time / 60);
			seconds = time - minutes * 60;
			time = minutes + '.' + seconds;
		}

		$('#video-annotations span.start_frame').html(time);
	}

	function getVideoId(){
		var current_url = window.location;
		query={};
		current_url.search.split('?')[1].split('&').forEach(function(i){query[i.split('=')[0]]=i.split('=')[1];});
		video_id = query['v']
	}

	//Get Video Id
	getVideoId();

	//Inject template to DOM
	if($(".player-api video")){
		//Keyup events
		document.onkeydown = triggerEvents;

		$('video').parents('.player-api').append(app_template);

		//Create new annotation
		var new_video_view = new video_app.newAnnotationView()
		new_video_view.updateStartFrame = updateStartFrame;

		//Load annotations
		annotations_view = new video_app.annotationsView({collection: video_app.Annotations});
		annotations_view.render();
		updateStartFrame(new_video_view.start_seconds);
	}

	$('#video-annotations span.left_arrow').on('click', function(e){
		$(this).fadeOut();
		$('#video-annotations .left_alignment').toggle( "slide" );
	});

	function renderStatus(statusText) {
		console.log('Success');
	}

	renderStatus('refresh');
})();