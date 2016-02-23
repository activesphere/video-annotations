var video_app = video_app || {};

(function (_) {
    console.log("Url: ", chrome.extension.getURL('templates.html'));
    //decelcngdojdjceagfcjklgpfdhdmenf
    $.get(chrome.extension.getURL('templates.html'),
        function (data, textStatus, jqXHR) {
            $('body').append(data);


            function checkAndEnableFeature(video_app) {
                return function () {
                    if ($('video').length > 0) {
                        if (!$("#video-annotations")[0]) {
                            var $video = getVideotag();
                            $video.append($('#video-main-template').html());
                        }
                        var appView = new video_app.appView();
                    } else {
                        if ($('#video-annotations')[0]) {
                            $('#video-annotations').remove();
                        }
                    }
                };
            }

            function getVideotag() {
                var $video = $('video').parent();
                // youtube specific stuff
                if ($('video').parents('.player-api').length > 0) {
                    $video = $('video').parents('.player-api');
                }
                return $video;
            }


            var observer = new MutationObserver(_.debounce(checkAndEnableFeature(video_app), 100));
            observer.observe(document.querySelector('body'), { childList: true });
        }, 'html');

})(_);