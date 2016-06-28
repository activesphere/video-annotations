import _ from 'lodash';
import $ from 'vendor/jquery.hotkeys.js';

import AppView from 'views/appView.js';
import Utils from 'utils.js';

import '../styles/app.less';
import '../styles/summary.less';

import React from 'react';
import ReactDOM from 'react-dom';
import VideoAnnotation from './containers/VideoAnnotation/VideoAnnotation';


$.get(chrome.extension.getURL('/html/templates.html'),
function (data) {
  $('body').append(data);
  var app;
  const videokey = {};

  const checkAndEnableFeature = () => {
    // application works on assumption that there is only one video in page
    if ($('video').length > 0 && $('video')[0].getAttribute('src')) {
      if (!$('#video-annotation')[0]) {
        var $video = Utils.getVideoInterface();

        if (window.location.hostname.match(/coursera/i)) {
          // coursera - stick with the old UI (a layer above the page)
          $video.append($('#video-main-template').html()); 
        } else if (window.location.hostname.match(/youtube/i)) {
          
          // new UI - annotations box becomes a part of the page
          $('.watch-sidebar').prepend($('#video-main-template').html());
                    
          $('head').append(
            `<style>
            #video-annotation {
              position: static !important;
            }
            #video-annotation .sidebar {
              position: static !important;
              width: 439px;
            }
            span.caret {
              display: none;
            }
            </style>`
          );

          // add react static box
          const videoKey = Utils.getVideoKey();
          $('.watch-sidebar').prepend('<div id="react-video-annotation" />');
          ReactDOM.render(
            <VideoAnnotation videoKey={videoKey}/>,
            document.querySelector('#react-video-annotation')
          );          
          
          
        } else {
          console.log('No site was detected');
        }
        
      }

      /* if (!app) {
       *   app = new AppView();
       * }

       * app.render(videokey);*/
    } else {
      if ($('#video-annotation')[0]) {
        $('#video-annotation').remove();
      }
    }
  };

  const observer = new MutationObserver(_.debounce(checkAndEnableFeature, 100));

  chrome.storage.local.get(data => {
    if (typeof data['video-annotation'] === 'undefined' || data['video-annotation']) {
      observer.observe(document.querySelector('body'), { childList: true });
      return;
    }
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
