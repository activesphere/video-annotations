import slug from 'slug';
import { currentTime } from './utils';

export function noteNameFromIdAndTitle(videoId, videoTitle) {
    if (!videoTitle) {
        videoTitle = '';
    }
    return `${slug(videoTitle)}-${videoId}.json`;
}

// A JSON serializable object representing a full note. Kept as values in the VIDEO_ID_TO_NOTE_DATA
// map.
export default class NoteData {
    constructor(videoId, videoTitle, editorValueAsJson, timeOfSave = currentTime()) {
        this.videoId = videoId;
        this.editorValueAsJson = editorValueAsJson;
        this.videoTitle = videoTitle;
        this.noteName = noteNameFromIdAndTitle(videoId, videoTitle);
        this.timeOfSave = currentTime();
    }
}
