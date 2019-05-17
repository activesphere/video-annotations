const AppConfig = {
    YoutubeIframeId: '__yt_iframe__',
    VidAnnotRootId: '__vid_annot_root__',
    CanvasId: '__image_destination_canvas__',

    // Between app and inject script
    CaptureCurrentFrameMessage: 'VID_ANNOT_CAPTURE_CURRENT_FRAME',
    CaptureCurrentFrameResponse: 'VID_ANNOT_CAPTURED_FRAME',

    RemovePauseOverlayMessage: 'VID_ANNOT_REMOVE_PAUSE_OVERLAY',

    // Between app and control script
    LoadInjectScriptMessage: 'LOAD_INJECT_SCRIPT',
};

export default AppConfig;
