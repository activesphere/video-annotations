import _ from 'lodash';
import $ from './vendor/jquery.hotkeys.js';

import Utils from './utils.js';
import syncingData, { syncOnChange } from './syncService.js';
import AppStorage from './localStorageUtils.js';

import '../styles/summary.less';

import React from 'react';
import ReactDOM from 'react-dom';
import VideoAnnotation from './containers/VideoAnnotation/VideoAnnotation';

import { receiveInitialState } from './actions';
import rootReducer from './reducers';

import { createStore } from 'redux';
import { Provider } from 'react-redux';


/* global chrome */
$.get(chrome.extension.getURL('/html/templates.html'),
(data) => {
  $('body').append(data);

  const checkAndEnableFeature = () => {
    // application works on assumption that there is only one video in page
    if ($('video').length > 0 && $('video')[0].getAttribute('src')) {
      if (!$('#video-annotation')[0]) {
        const $video = Utils.getVideoInterface();

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
        }

        // inject this div for the summary/share thing in DOM
        const summaryHolder = document.createElement('div');
        summaryHolder.className = 'summary-page';
        document.getElementsByTagName('body')[0]
                .appendChild(summaryHolder);

        // add react static box
        const videoKey = Utils.getVideoKey();
        const store = createStore(rootReducer);
        
        $('.watch-sidebar').prepend('<div id="react-video-annotation" />');
        
        ReactDOM.render(
          <Provider store={store}>
            <VideoAnnotation />
          </Provider>,
          document.querySelector('#react-video-annotation')
        );

        const storage = new AppStorage({ name: videoKey });
        const dropboxFile = Utils.dropbox(videoKey);
        storage.name = videoKey;
        dropboxFile.name = videoKey;
        
        // sync up all three sources (localStorage, dropbox, memory)
        // initial sync
        syncingData(
          storage,
          dropboxFile,
          { annotations: [], metadata: {} },
          true
        ).then((notes) => {
          const host = Utils.hosts[window.location.hostname];
          const pagedata = Utils.getVideoInfo(host);
          // if it's first time visiting this video,
          // notes will be undefined, hense
          const $notes = typeof notes === 'undefined' ?
                         { annotations: [],
                           metadata: {},
                         } : notes;
          $notes.metadata = Object.assign({}, $notes.metadata, pagedata);
          store.dispatch(receiveInitialState($notes));
        });

        let currState;
        const stateChangeTracker = () => {
          const prevState = currState;
          currState = store.getState();
          syncOnChange(prevState, currState, storage, dropboxFile);
        };
        
        store.subscribe(stateChangeTracker);
      }
    } else {
      if ($('#video-annotation')[0]) {
        $('#video-annotation').remove();
      }
    }
  };

  const observer = new MutationObserver(_.debounce(checkAndEnableFeature, 100));

  chrome.storage.local.get(_data => {
    if (typeof _data['video-annotation'] === 'undefined' || _data['video-annotation']) {
      observer.observe(document.querySelector('body'), { childList: true });
      return;
    }
  });

  chrome.storage.onChanged.addListener(dataChanged => {
    const toggleDomObservation = enabled => {
      if (enabled) {
        observer.observe(document.querySelector('body'), { childList: true });
        checkAndEnableFeature();
        return;
      }

      observer.disconnect();
    };

    if (dataChanged['video-annotation']) {
      toggleDomObservation(dataChanged['video-annotation'].newValue);
    }
  });
}, 'html');
