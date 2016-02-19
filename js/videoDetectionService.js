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
                        // TODO: This does not belong here. Move to a new view
                        if (!$("#video-annotations")[0]) {
                            var $video = getVideotag();
                            $video.append($('#video-main-template').html());
                        }
                        // Apparently even though append is synchronous, chrome will not block dom manipulation.
                        // Figure out a cleaner way to render app view
                        setTimeout(function () {
                            var app_view = new video_app.appView();
                            app_view.clear();
                            app_view.render();
                        }, 500);
                    } else {
                        app_view.clear();
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


            var observer = new MutationObserver(_.debounce(checkAndEnableFeature(video_app), 2000));
            observer.observe(document.querySelector('body'), { childList: true });
        }, 'html');

})(_);