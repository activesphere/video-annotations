// Functions for storing notes to dropbox
import { Dropbox } from 'dropbox';
import readBlobAsString from './utils/readBlobAsString';
import pathJoin from './utils/pathJoin';
import dropboxConfig from './dropboxConfig';
import isYouTubeId from './isYouTubeId';
import * as session from './session';

const NOTES_FOLDER_PATH = pathJoin(dropboxConfig.notesFolderParent, dropboxConfig.notesFolderName);

const getDbx = (() => {
  let db: any;

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

interface Video {
  videoId: string;
  title: string;
}

export const save = async (name: string, noteData: Video) => {
  const dbx = getDbx();

  if (!dbx || !noteData.videoId) return null;

  const fileName = `${noteData.videoId} - ${noteData.title}.json`;

  return dbx.filesUpload({
    contents: JSON.stringify(noteData),
    mode: { '.tag': 'overwrite' },
    path: pathJoin(NOTES_FOLDER_PATH, name || fileName),
    autorename: false,
  });
};

export const deleteFile = async (filename: string) => {
  const dbx = getDbx();

  if (!dbx || !filename) return null;

  const path = pathJoin(NOTES_FOLDER_PATH, filename);

  return dbx.filesDelete({ path });
};

export const downloadNote = async (id: string) => {
  const dbx = getDbx();

  const { matches } = await dbx.filesSearch({
    path: NOTES_FOLDER_PATH,
    query: `${id} - `,
    mode: 'filename',
  });

  if (!matches || !matches.length) return null;

  const file = matches.find(({ metadata }: any) => {
    if (metadata['.tag'] !== 'file' || !metadata.is_downloadable) return false;

    return metadata.name.match(new RegExp(`^${id} - `));
  });

  if (!file) return null;

  const { metadata } = file;

  const path = metadata.path_display;

  const { fileBlob } = await dbx.filesDownload({ path });

  const content = await readBlobAsString(fileBlob);

  if (!content) return null;

  return { ...JSON.parse(content), name: metadata.name };
};

interface DropboxEntries {
  name: string;
  path_display: string;
  '.tag': string;
}

export const listNotes = async () => {
  const dbx = getDbx();

  const listFolderResult: { entries: DropboxEntries[] } = await dbx.filesListFolder({
    path: NOTES_FOLDER_PATH,
    recursive: true,
  });

  const notePaths = listFolderResult.entries.filter(x => x['.tag'] === 'file');

  return notePaths
    .map(({ name }) => {
      const parts = name.split(' - ');

      const id = parts[0];
      const title = parts
        .slice(1)
        .join(' - ')
        .replace(/.json$/, '');

      return { id, title, filename: name };
    })
    .filter(({ id }) => isYouTubeId(id));
};
