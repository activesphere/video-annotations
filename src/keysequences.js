// A map of sequence to command name for the editor. Not yet 'fully' configurable. < and > are fixed
// as the characters to denote the number of seconds.

export default {
    '#>': 'playVideo',
    '#/': 'pauseVideo',
    '#t>': 'playVideoWithTimestamp',
    '#t/': 'pauseVideoWithTimestamp',
    '##<*g': 'seekBackwardNSeconds', // N = number of '<'
    '##>*g': 'seekForwardNSeconds', // N = number of '>'
};
