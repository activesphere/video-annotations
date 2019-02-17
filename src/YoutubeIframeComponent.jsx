import React, { Component } from 'react';
import PropTypes from 'prop-types';

let ytPlayerApiLoadedPromise = undefined;
let ytPlayerApiLoaded = false;

export default class YoutubeIframeComponent extends Component {
    static propTypes = {
        // (refToPlayerDiv) => void
        getYtPlayerApiCallback: PropTypes.func.isRequired,
        parentApp: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.refToPlayerDiv = undefined;
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }

    render() {
        return (
            <div className="youtube-player">
                <div
                    ref={refToPlayerDiv => {
                        this.refToPlayerDiv = refToPlayerDiv;
                    }}
                />
            </div>
        );
    }

    // In cDM we load the youtube api.
    componentDidMount() {
        if (ytPlayerApiLoadedPromise) {
            if (ytPlayerApiLoaded) {
                console.log('Youtube IFrame API loaded already.');
                console.assert(!!window.YT, `window.YT = ${window.YT}`);
                // Loaded the iframe api already. Simply call the parent callback.
                this.props.getYtPlayerApiCallback({
                    YT: window.YT,
                    refToPlayerDiv: this.refToPlayerDiv,
                });
                return;
            } else {
                console.log('Youtube Iframe loading in progress');
                return;
            }
        }

        if (!ytPlayerApiLoadedPromise) {
            // First time loading the iframe api..

            console.log('Mounted youtube iframe component. Youtube API not loaded. Loading...');

            if (this.props.startingVideoId) {
                console.log('... Also loading a starting videoId =', this.props.startingVideoId);
            }

            // If timeout is expired this is set to true. Even if the player API loads after this is set, we tell the user to reload.
            let timeoutExpired = false;

            ytPlayerApiLoadedPromise = new Promise((resolve, reject) => {
                // Create the element for Youtube API script and attach it to the HTML.
                const apiScriptElement = document.createElement('script');
                apiScriptElement.src = 'https://www.youtube.com/iframe_api';
                apiScriptElement.id = '__iframe_api__';

                document.body.appendChild(apiScriptElement);

                // Pass the YT object as the result of the promise
                window.onYouTubeIframeAPIReady = () => {
                    if (timeoutExpired) {
                        reject(
                            new Error('Loaded youtube player api but timeout expired before load')
                        );
                        return;
                    }

                    console.log('Youtube IFrame API Loaded...');

                    console.log('... YT.playVideo =', window.YT.playVideo);
                    resolve({
                        YT: window.YT,
                        refToPlayerDiv: this.refToPlayerDiv,
                    });

                    ytPlayerApiLoaded = true;
                };
            });

            ytPlayerApiLoadedPromise.then(this.props.getYtPlayerApiCallback);

            // If youtube api doesn't load within 4 seconds, we show a message and tell user to reload.
            const timeoutPromise = new Promise((resolve, reject) => {
                const timeoutSeconds = 10;
                setTimeout(() => {
                    if (!ytPlayerApiLoaded) {
                        const msg = `Failed to load youtube player api in ${timeoutSeconds} seconds`;
                        console.assert(false, msg);

                        this.props.parentApp.showInfo(
                            '',
                            3600.0,
                            'Timeout. Failed to load youtube api. Reload page and try again.'
                        );
                    }
                }, timeoutSeconds * 1000);
            });

            Promise.race([timeoutPromise, ytPlayerApiLoadedPromise]);
        }
    }
}
