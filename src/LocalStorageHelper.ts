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

export const deleteNoteWithId = (filename: string) => {
  return dbx.deleteFile(filename);
};

export const save = (name: string, noteData: any) => {
  if (!noteData.videoId) Promise.reject();
  return dbx.save(name, noteData);
};

export const getNoteMenuItemsForCards = () => {
  return dbx.listNotes();
};
