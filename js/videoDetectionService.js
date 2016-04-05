import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';

import AppView from 'views/appView.js';
import Utils from 'utils.js';

import '../styles/app.less';

$.get(chrome.extension.getURL('/html/templates.html'),
function (data) {
  $('body').append(data);
  var app;
  const videokey = {};

  const checkAndEnableFeature = () => {
    if ($('video').length > 0) {
      if (!$('#video-annotation')[0]) {
        var $video = Utils.getVideoInterface();
        $video.append($('#video-main-template').html());
      }

      if (!app) {
        app = new AppView();
      }

      app.render(videokey);
    } else {
      if ($('#video-annotation')[0]) {
        $('#video-annotation').remove();
      }
    }
  };

  const observer = new MutationObserver(_.debounce(checkAndEnableFeature, 100));

  chrome.storage.local.get(data => {
    if (data['video-annotation']) {
      observer.observe(document.querySelector('body'), { childList: true });
      return;
    }

    observer.disconnect();
  });

  chrome.storage.onChanged.addListener(data => {
    const toggleDomObservation = enabled => {
      if (enabled) {
        observer.observe(document.querySelector('body'), { childList: true });
        checkAndEnableFeature();
        return;
      }

      observer.disconnect();
    };

    if (data['video-annotation']) {
      toggleDomObservation(data['video-annotation'].newValue);
    }
  });
}, 'html');
