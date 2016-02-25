import _ from 'lodash';
import $ from 'lib/jquery.hotkeys.js';

import AppView from 'backbone/views/app-view.js';

console.log('Url: ', chrome.extension.getURL('templates.html'));

//decelcngdojdjceagfcjklgpfdhdmenf
$.get(chrome.extension.getURL('templates.html'),
function (data, textStatus, jqXHR) {
  $('body').append(data);
  var appState = {};

  function checkAndEnableFeature() {
    return function () {
      if ($('video').length > 0) {
        if (!$('#video-annotations')[0]) {
          var $video = getVideotag();
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

  function getVideotag() {
    var $video = $('video').parent();

    // youtube specific stuff
    if ($('video').parents('.player-api').length > 0) {
      $video = $('video').parents('.player-api');
    }

    return $video;
  }

  var observer = new MutationObserver(_.debounce(checkAndEnableFeature(), 100));
  observer.observe(document.querySelector('body'), { childList: true });
}, 'html');
