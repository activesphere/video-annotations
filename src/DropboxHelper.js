// Functions for storing notes to dropbox
import { Dropbox } from 'dropbox';
import readBlobAsString from './utils/readBlobAsString';
import pathJoin from './utils/pathJoin';
import dropboxConfig from './dropboxConfig';
import isYouTubeId from './isYouTubeId';
import * as session from './session';

const NOTES_FOLDER_PATH = pathJoin(dropboxConfig.notesFolderParent, dropboxConfig.notesFolderName);

const getDbx = (() => {
  let db;

  return () => {
    if (db) return db;

    const accessToken = session.get('dbxToken');
    db = new Dropbox({
      accessToken,
      clientId: process.env.REACT_APP_DROPBOX_KEY,
      fetch: window.fetch,
    });

    return db;
  };
})();

export const save = async noteData => {
  const dbx = getDbx();

  if (!dbx || !noteData.videoId) return null;

  const fileName = `${noteData.videoId} - ${noteData.title}.json`;

  return dbx.filesUpload({
    contents: JSON.stringify(noteData),
    mode: { '.tag': 'overwrite' },
    path: pathJoin(NOTES_FOLDER_PATH, fileName),
    autorename: false,
  });
};

export const downloadNote = async id => {
  const dbx = getDbx();

  const { matches } = await dbx.filesSearch({
    path: NOTES_FOLDER_PATH,
    query: `${id} - `,
    mode: 'filename',
  });

  const { metadata } = matches.find(({ metadata }) => {
    if (metadata['.tag'] !== 'file' || !metadata.is_downloadable) return false;

    if (!metadata.name.match(new RegExp(`^${id} - `))) return false;

    return true;
  });

  const path = metadata.path_display;

  const { fileBlob } = await dbx.filesDownload({ path });

  const content = await readBlobAsString(fileBlob);

  return JSON.parse(content);
};

export const listNotes = async () => {
  const dbx = getDbx();

  const listFolderResult = await dbx.filesListFolder({
    path: NOTES_FOLDER_PATH,
    recursive: true,
  });

  const notePaths = listFolderResult.entries.filter(x => x['.tag'] === 'file');

  return notePaths
    .map(({ name, path_display }) => {
      const parts = name.split(' - ');

      const id = parts[0];
      const title = parts
        .slice(1)
        .join(' - ')
        .replace(/.json$/, '');

      return { id, title };
    })
    .filter(({ id, title }) => isYouTubeId(id));
};
