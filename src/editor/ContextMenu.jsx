import React from 'react';
import { Mark } from 'slate';
import { secondsToHhmmss } from '../utils';
import { Menu, contextMenu, Item, Separator, Submenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.min.css';

const makeYoutubeTimestampMark = ({ videoId, videoTime }) =>
    Mark.create({ type: 'youtube_timestamp', data: { videoId, videoTime } });

const showContextMenu = event => {
    event.preventDefault();
    contextMenu.show({
        id: 'editor_context_menu',
        event,
    });
};

// Context menu that is shown when user selects a range of text and right clicks.
const EditorContextMenu = ({
    storedTimestamps,
    editorValue: { selection },
    editorRef,
    currentVideoId,
    children,
}) => {
    const { isExpanded } = selection;

    let timestampItems = null;

    if (isExpanded) {
        timestampItems = storedTimestamps.map(s => {
            return (
                <Item
                    onClick={() => {
                        if (currentVideoId !== s.videoId) {
                            console.log('Attempted to put timestamp saved for different video');
                            return;
                        }
                        const timeStampMark = makeYoutubeTimestampMark(s);
                        editorRef.addMarkAtRange(selection, timeStampMark);
                    }}
                    key={`${s.videoTime}_${s.videoId}`}
                >
                    {`${s.text}(${secondsToHhmmss(s.videoTime)})`}
                </Item>
            );
        });
    }

    return (
        <div onContextMenu={showContextMenu}>
            <Menu id="editor_context_menu">
                {isExpanded ? (
                    <>
                        <Submenu label="Set timestamp">{timestampItems}</Submenu>
                        <Separator />
                    </>
                ) : null}
                <Item> Add timestamp</Item>
                <Item> Add current timestamp</Item>
            </Menu>
            {children}
        </div>
    );
};

export default EditorContextMenu;
