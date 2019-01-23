import React from 'react';

export default function ShowInstructionsComponent(props) {
    const keySequenceInfoText = `
 _______ __   _ __   _  _____  _______ _______ _______  _____   ______
 |_____| | \  | | \  | |     |    |    |_____|    |    |     | |_____/
 |     | |  \_| |  \_| |_____|    |    |     |    |    |_____| |    \_

    	
Default key sequences for controlling video
===========================================

# >                         					Play Video,
# /                         					Pause Video,
# t >                       					Place Timestamp and Play video
# t /                       					Place Timestamp and Pause video
# [optional -] [some number N] [s or m] s    	Seek forward or backward N seconds or minutes

Hotkeys
===========================================

Ctrl + D                    Seek to timestamp under cursor
`;

    console.log('keySequenceInfoText =', keySequenceInfoText);

    const infoText = props.infoText ? props.infoText : keySequenceInfoText;

    return (
        <div className="info-text">
            <p id="__info_text__">{infoText}</p>
        </div>
    );
};
