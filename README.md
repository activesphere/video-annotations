## This app is under rapid development not ready for use yet

## Annotate videos

A chrome extension to annotate videos & share it with others via dropbox
Ideal for creating indices for educational content

## First time setup

- Add extension to chrome. Copy id generated
- Create an app on https://www.dropbox.com/developers/apps
- Choose 'Dropbox API', 'App folder' & name your app something
- Add redirect URI in the following format chrome-extension://your-chrome-id/html/chrome_oauth_receiver.html
- Copy app key

```
cp js/config.example.js js/config.js
```
- replace key in config with your dropbox app key

```
npm install
bower install
webpack
```
