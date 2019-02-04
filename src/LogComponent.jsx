import React from 'react';

export const defaultInfoText = `
Default key sequences for controlling video
===========================================

# .                                             Play Video,
# /                                             Pause Video,
# t .                                           Place Timestamp and Play video
# t /                                           Place Timestamp and Pause video
# [optional -] [some number N] [s or m] s       Seek forward or backward N seconds or minutes

Hotkeys
===========================================

Ctrl + D                                        Seek to timestamp under cursor
Select text and press Ctrl + \\                 Make timestamp at selected text
Ctrl + S                                        Load note for current video
Ctrl + L                                        Save note for current video
Ctrl + H                                        Save timestamp in a list for later usage

`;

export default function ShowInstructionsComponent(props) {
    const infoText = props.infoText ? props.infoText : defaultInfoText;

    const style = {};

    if (infoText.length < 100) {
        style.fontSize = 20;
    }

    return (
        <div className="info-text" style={style}>
            <p id="__info_text__">{infoText}</p>
        </div>
    );
}
