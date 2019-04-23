import React from 'react';
import { Mark } from 'slate';
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
const EditorContextMenu = ({ children }) => {
    return (
        <div onContextMenu={showContextMenu}>
            <Menu id="editor_context_menu">
                <Item> Add timestamp</Item>
                <Item> Add current timestamp</Item>
            </Menu>
            {children}
        </div>
    );
};

export default EditorContextMenu;
