import _ from 'lodash';
import $ from 'lib/jquery.hotkeys.js';

import AppView from 'backbone/views/app-view.js';
import Utils from 'utils.js';

$.get(chrome.extension.getURL('templates.html'),
function (data) {
  $('body').append(data);
  var appState = {};

  function checkAndEnableFeature() {
    return function () {
      if ($('video').length > 0) {
        if (!$('#video-annotations')[0]) {
          var $video = Utils.getVideoInterface();
          $video.append($('#video-main-template').html());
        }

        var view = new AppView(appState);
        appState.view = view;
      } else {
        if ($('#video-annotations')[0]) {
          $('#video-annotations').remove();
        }
      }
    };
  }

  var observer = new MutationObserver(_.debounce(checkAndEnableFeature(), 100));
  observer.observe(document.querySelector('body'), { childList: true });
}, 'html');
