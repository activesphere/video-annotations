import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';

import AppView from 'views/appView.js';
import Utils from 'utils.js';

import '../styles/app.less';

$.get(chrome.extension.getURL('/html/templates.html'),
function (data) {
  $('body').append(data);
  var app;

  function checkAndEnableFeature() {
    return function () {
      if ($('video').length > 0) {
        if (!$('#video-annotation')[0]) {
          var $video = Utils.getVideoInterface();
          $video.append($('#video-main-template').html());
        }

        if (app) {
          app.render();
        } else {
          app = new AppView();
          app.render();
        }

        app.render();
      } else {
        if ($('#video-annotation')[0]) {
          $('#video-annotation').remove();
        }
      }
    };
  }

  var observer = new MutationObserver(_.debounce(checkAndEnableFeature(), 100));
  observer.observe(document.querySelector('body'), { childList: true });
}, 'html');
