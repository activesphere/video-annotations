// We store a map of videoId to note data and a map of note name to videoId so that we can search
// both with videoId and with noteName.

const LS_KEYS = {
    NOTENAME_TO_VIDEO_ID: 'note_name_to_video_id',
    VIDEO_ID_TO_NOTE_DATA: 'video_id_to_note_data',
};

// Initialize maps if they don't exist
function initMaps() {
    for (const [_, name] of Object.entries(LS_KEYS)) {
        if (!localStorage.getItem(name)) {
            localStorage.setItem(name, '{}');
        }
    }
}

function getVideoIdOfNote(noteName) {
    initMaps();
    let savedMap = JSON.parse(localStorage.getItem(LS_KEYS.NOTENAME_TO_VIDEO_ID));
    return savedMap[noteName];
}

function saveVideoIdOfNote(noteName, videoId) {
    initMaps();
    let savedMap = JSON.parse(localStorage.getItem(LS_KEYS.NOTENAME_TO_VIDEO_ID));
    savedMap[noteName] = videoId;
    localStorage.setItem(LS_KEYS.NOTENAME_TO_VIDEO_ID, JSON.stringify(savedMap));
}

export function saveVideoNote(videoId, strEditorState, noteName) {
    initMaps();

    let idToNoteData = JSON.parse(localStorage.getItem(LS_KEYS.VIDEO_ID_TO_NOTE_DATA));

    const key = `saved_noted_${videoId}`;
    if (!(key in idToNoteData)) {
        idToNoteData[key] = {
            videoId,
            strEditorState,
            noteName,
        };
    } else {
        idToNoteData[key].videoId = videoId;
        idToNoteData[key].strEditorState = strEditorState;
        idToNoteData[key].noteName = noteName;
    }

    localStorage.setItem(LS_KEYS.VIDEO_ID_TO_NOTE_DATA, JSON.stringify(idToNoteData));
    saveVideoIdOfNote(noteName, videoId);
}

export function loadVideoNote(videoId) {
	initMaps();

	let idToNoteData = JSON.parse(localStorage.getItem(LS_KEYS.VIDEO_ID_TO_NOTE_DATA));
	const key = `saved_note_${videoId}`;

	if (!(key in idToNoteData)) {
		return undefined;
	}
	return idToNoteData[key].strEditorState;
}
