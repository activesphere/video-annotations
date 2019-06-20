import * as dbx from './DropboxHelper';

const VIDEO_ID_TO_NOTE_DATA = 'video_id_to_note_data';

const readMapFromLocalStorage = () => {
  const strMap = localStorage.getItem(VIDEO_ID_TO_NOTE_DATA);

  return strMap ? JSON.parse(strMap) : {};
};

const idToNoteData = readMapFromLocalStorage();

export const loadNoteWithId = (videoId: string) => idToNoteData[videoId] || {};

export const loadNote = (videoId: string) => {
  return dbx.downloadNote(videoId);
};

export const deleteNoteWithId = (videoId: string) => {
  if (!idToNoteData[videoId]) return;

  delete idToNoteData[videoId];
};

export const save = (noteData: any) => {
  if (!noteData.videoId) return;
  return dbx.save(noteData);
};

export const getNoteMenuItemsForCards = () => {
  return dbx.listNotes();
};
