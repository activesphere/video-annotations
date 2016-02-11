var video_app = video_app || {};

(function(_) {
  console.log("Url: ", chrome.extension.getURL('templates.html'));
  //decelcngdojdjceagfcjklgpfdhdmenf
  $.get(chrome.extension.getURL('templates.html'),
    function(data, textStatus, jqXHR){
    $('body').append(data);
    var video = setInterval(function() {
      if ($('video').length > 0) {
        var $video = $('video').parent();
        if ($('video').parents('.player-api').length > 0) {
          $video = $('video').parents('.player-api');
        }
        $video.append($('#video-main-template').html());
        app_view = new video_app.appView();
        app_view.render();
        clearInterval(video);
      }
    }, 1500);

    var currentSearch = window.location.search;
    setInterval(function() {
      if (window.location.search !== currentSearch) {
        currentSearch = window.location.search;
        console.log("loca: ", app_view);
        app_view.getVideoKey();
        app_view.updateVideoKey();
        app_view.syncData();
      }
    }, 1000);
  }, 'html');

  console.log('Success');
})(_);