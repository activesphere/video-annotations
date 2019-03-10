import React from 'react';
import { Mark } from 'slate';
import { secondsToHhmmss } from '../utils';
import { Menu, contextMenu, Item, Separator, Submenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';

const makeYoutubeTimestampMark = (videoId, videoTime) =>
    Mark.create({ type: 'youtube_timestamp', data: { videoId, videoTime } });

// Context menu that is shown when user selects a range of text and right clicks.
const EditorContextMenu = ({ storedTimestamps, editorValue, editorRef, currentlyPlayingVideo }) => {
    const selection = editorValue.selection;

    console.log('selection', selection);

    const timestampItems = selection.isExpanded
        ? storedTimestamps.map(s => {
              return (
                  <Item
                      onClick={() => {
                          if (currentlyPlayingVideo !== s.videoId) {
                              console.log('Attempted to put timestamp saved for different video');
                              return;
                          }
                          const timeStampMark = makeYoutubeTimestampMark(s.videoId, s.videoTime);
                          editorRef.addMarkAtRange(selection, timeStampMark);
                      }}
                      key={`${s.videoTime}_${s.videoId}`}
                  >
                      {`${s.text}(${secondsToHhmmss(s.videoTime)})`}
                  </Item>
              );
          })
        : null;

    return (
        <Menu id="editor_context_menu">
            {selection.isExpanded ? (
                <>
                    <Submenu label="Set timestamp">{timestampItems}</Submenu>
                    <Separator />
                </>
            ) : null}
            <Item> Add timestamp</Item>
            <Item> Add current timestamp</Item>
        </Menu>
    );
};

export const showContextMenu = event =>
    contextMenu.show({
        id: 'editor_context_menu',
        event,
    });

export default EditorContextMenu;
