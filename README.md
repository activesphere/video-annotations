## Video Annotator

Take notes while watching a YouTube video.

#### Markdown status

Supporting something like "markdown-lite". Bold, italic, underline, headers,
bullet-list, code. Markdown is previewed but the markdown symbols themselves
are also shown in the preview so that you can copy paste into some markdown to
html/pdf converter or another text editor.

#### Video timestamps

You can place timestamp links in the document and seek to that time in the
corresponding video.

#### Saved notes

Notes are saved per video.

#### `.env` file

Need to have these keys before launching the app. First two are app specific token.
Sharing privately. Last one needs to be generated by the user himself.

REACT_APP_DROPBOX_KEY=some_key
REACT_APP_DROPBOX_SECRET=some_secret
REACT_APP_DROPBOX_SOUMIKS_ACCESS_TOKEN=some_access_token


#### Save Notes to Dropbox (WIP)

Open `localhost:<port>`, get redirected to `/dropbox_oauth` (or just open that directly).
Enter access token for Dropbox. Now you can use the saveToDropbox shortcut (ctrl+shift+s)
to save the note to dropbox. See `userConfig.js` for dropbox related configuration.

If you don't authorize with Dropbox via the `/dropbox_oauth` screen, commnds for
saving to dropbox and loading new notes from dropbox are silently ignored.

TODO: Delete notes from dropbox.