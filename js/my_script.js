(function() {
	var video_status = 'play', video_tag = $('video')[0], video_id = null, annotations = {};

	//Trigger Ctrl + n
	function newAnnotation(e) {
		var evtobj = window.event? event : e
		if (evtobj.keyCode == 78 && evtobj.ctrlKey){
			video_tag.pause();
			video_status = 'pause';
			renderNewAnnotation($('video'));
		}
	}

	//Render text area
	function renderNewAnnotation($view){
		var template = "<textarea  class='annotation_text' rows='4' cols='20'></textarea>";
		$('#annotations .new_annotation').html(template);
		$('#annotations .new_annotation .annotation_text').focus();
		$('#annotations .new_annotation .annotation_text').keyup(saveAnnotation);
		$('#annotations .new_annotation .annotation_text').keydown(ignore);
		$('#annotations .new_annotation .annotation_text').click(ignore);
	}

	//Ignore events
	function ignore(event) {
		console.log('event', event);
		event.stopPropagation();
	}

	function saveAnnotation(event){
		ignore(event);
		if (event.keyCode == 13 && event.ctrlKey){
			var c_time = parseInt(video_tag.currentTime);
			if(!annotations[video_id]) annotations[video_id] = {}
			var annotation = annotations[video_id];
			annotation[c_time] = event.target.value;
			annotations[video_id] = annotation;
			$('#annotations .new_annotation').empty();
			video_tag.play();

			loadAnnotations();
			renderStatus(annotations);
		}
	}

	function loadAnnotations(){
		$('#annotations_list').empty();
		var list = getCurrentList();
		_.each(list, function(value, key){
			$('#annotations_list').append('<li><a href=#t='+key+'><span>'+value+'</span></a></li>');
			$('#annotations_list li:last a').click(ignore);
		});
	}

	function getCurrentList(){
		return annotations[video_id] || {}
	}

	function videoStatus(){
		if(video_status == 'pause'){
			video_tag.pause();
		}
	}

	function getVideoId(){
		var current_url = window.location;
		query={};
		current_url.search.split('?')[1].split('&').forEach(function(i){query[i.split('=')[0]]=i.split('=')[1];});
		video_id = query['v']
	}

	document.onkeydown = newAnnotation;
	//Get Video Id
	getVideoId();

	$('video').parent().append("<div id='annotations' style='position:absolute;'><div class='new_annotation'></div></div>");
	$('video').parent().append("<ul id='annotations_list' style='position:absolute;right: 0px;width:200px;color:black;background: white;'></ul>");

	function renderStatus(statusText) {
		console.log('Success');
	}

	renderStatus('refresh');
})();