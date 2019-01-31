import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class YoutubeIframeComponent extends Component {
    static propTypes = {
        // (refToPlayerDiv) => void
        getYtPlayerApiCallback: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.refToPlayerDiv = undefined;
        this.ytPlayerApiLoadedPromise = undefined;
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
        if (!this.ytPlayerApiLoadedPromise) {
            let loadedYtPlayerApi = false;

            this.ytPlayerApiLoadedPromise = new Promise((resolve, reject) => {
                // Create the element for Youtube API script and attach it to the HTML.
                const apiScriptElement = document.createElement('script');
                apiScriptElement.src = 'https://www.youtube.com/iframe_api';
                apiScriptElement.id = '__iframe_api__';

                document.body.appendChild(apiScriptElement);

                // Pass the YT object as the result of the promise
                window.onYouTubeIframeAPIReady = () => {
                    resolve({
                        YT: window.YT,
                        refToPlayerDiv: this.refToPlayerDiv,
                    });

                    loadedYtPlayerApi = true;
                };
            });

            this.ytPlayerApiLoadedPromise.then(this.props.getYtPlayerApiCallback);

            // If youtube api doesn't load within 4 seconds, we freaking crash x_). For now.
            const timeoutPromise = new Promise((resolve, reject) => {
                const timeoutSeconds = 10;
                setTimeout(() => {
                    if (!loadedYtPlayerApi) {
                        console.assert(
                            false,
                            `Failed to load youtube player api in ${timeoutSeconds} seconds`
                        );
                    }
                }, timeoutSeconds * 1000);
            });

            Promise.race([timeoutPromise, this.ytPlayerApiLoadedPromise]);
        }
    }
}