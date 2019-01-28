import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class LoadYoutubeVideoIdComponent extends Component {
    static propTypes = {
        locked: PropTypes.bool,
        focussed: PropTypes.bool,
        value: PropTypes.string,
        error: PropTypes.string,
        label: PropTypes.string,
        onChange: PropTypes.func,
        onSubmit: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            focussed: (props.locked && props.focussed) || false,
            value: props.value ? props.value : '',
            error: props.error ? props.error : '',
            label: props.label ? props.label : 'Youtube Video ID',
        };

        this.handleChange = event => {
            const value = event.target.value;
            this.setState({ ...this.state, value, error: '' });

            if (this.props.onChange) {
                return this.props.onChange(value);
            }
        };

        this.handleSubmit = event => {
            event.preventDefault();
            // this.setState({ ...this.state, value, error: '' });
            return this.props.onSubmit(this.state.value);
        };
    }

    render() {
        const { value, label } = this.state;

        return (
            <div className="youtube-id-input">
                <form onSubmit={this.handleSubmit}>
                    <input
                        id="__yt_video_id_input__"
                        type="text"
                        value={value}
                        placeholder={label}
                        onChange={this.handleChange}
                        spellCheck="false"
                    />
                </form>
            </div>
        );
    }
}
