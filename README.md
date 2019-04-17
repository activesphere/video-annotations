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

#### Dropbox specifiv values in the `.env` file

Need to have these keys before launching the app. First two are app specific token.
Sharing privately. Last one needs to be generated by the user himself.

REACT_APP_DROPBOX_KEY=some_key
REACT_APP_DROPBOX_SECRET=some_secret
REACT_APP_DROPBOX_ACCESS_TOKEN=some_access_token

#### Save Notes to Dropbox (WIP)

Open `localhost:<port>`, get redirected to `/dropbox_oauth` (or just open that
directly). Enter access token for Dropbox. Now notes will be saved to dropbox
(as well as localstorage).

If you don't authorize with Dropbox via the `/dropbox_oauth` screen, commnds for
saving to dropbox and loading new notes from dropbox are silently ignored.

TODO: Delete notes from dropbox.

#### Capture image

Install the frame_capture_extension. You have to activate the extension (click
on its icon) to inject the script into the page. Then while editing press the
captureFrame shortcut to insert current video frame into the editor.
