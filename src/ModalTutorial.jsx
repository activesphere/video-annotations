// Doing a tutorial on making modal components

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { searchNotesByName } from './save_note';

const modalTriggerButtonStyle = {
    padding: '.1em .5em',
    color: '#4285f4',
    background: '#e2edff',
    border: '2px solid #bad2fa',
    borderRadius: '1em',
    cursor: 'pointer',
};

// Button that triggers the modal
const ModalTriggerButton = ({ label, onClick }) => (
    <button className="c-btn" style={modalTriggerButtonStyle} onClick={onClick}>
        {label}
    </button>
);

// The modal component itself
const ModalContent = props => {
    const modalCoverStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        backgroundColor: '#f0f0d070',
    };

    const modalStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        transform: 'translate(-50%,-50%)',
        padding: '2.5em 1.5em 1.5em 1.5em',
        backgroundColor: '#000000',
        color: '#f0f0d0',
        boxShadow: '0 0 10px 3px rgba(0.8, 0.95, 0.2, 0.8)',
        overflowY: 'auto',
    };

    const modalCloseStyle = {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: '.5em',
        lineHeight: 1,
        background: '#f6f6f8',
        border: 0,
        boxShadow: 0,
        cursor: 'pointer',
    };

    const modalCloseIconStyle = {
        width: '25px',
        height: '25px',
        fill: 'transparent',
        stroke: 'black',
        strokeLinecap: 'round',
        strokeWidth: 2,
    };

    const modalBodyStyle = {
        paddingTop: '.25em',
    };

    const { modalText } = props;

    const modalElement = (
        <aside tabIndex="-1" className="c-modal-cover" style={modalCoverStyle}>
            <div className="c-modal" style={modalStyle}>
                <button
                    className="c-modal__close"
                    style={modalCloseStyle}
                    onClick={props.onClickModalClose}
                >
                    <span className="u-hide-visually">Close</span>
                    <svg
                        className="c-modal__close-icon"
                        viewBox="0 0 40 40"
                        style={modalCloseIconStyle}
                    >
                        <path d="M 10,10 L 30,30 M 30,10 L 10,30" />
                    </svg>
                </button>
                <div className="c-modal__body" style={modalBodyStyle}>
                    <pre>{modalText ? modalText : null}</pre>
                </div>
            </div>
        </aside>
    );

    return ReactDOM.createPortal(modalElement, document.body);
};

export class NewbModal extends Component {
    constructor(props) {
        super(props);

        this.state = { isOpen: false };

        this.setAsOpen = () => {
            this.setState({ ...this.state, isOpen: true });
        };

        this.setAsClosed = () => {
            this.setState({ ...this.state, isOpen: false });
        };
    }

    render() {
        const { buttonLabel, disable, modalText } = this.props;

        const { isOpen } = this.state;

        if (disable) {
            return null;
        }

        return (
            <Fragment>
                <ModalTriggerButton label={buttonLabel} onClick={this.setAsOpen} />
                {!isOpen ? null : (
                    <ModalContent modalText={modalText} onClickModalClose={this.setAsClosed} />
                )}
            </Fragment>
        );
    }
}

// ----------------------- Search menu

const makeSearchMenuListItem = (mainText, subText, keyProp) => {
    return (
        <li key={keyProp}>
            <div className="searchmenu-li-maintext">{mainText}</div>
            <div className="searchmenu-li-subtext">{subText ? subText : ''}</div>
        </li>
    );
};

class SearchMenuInputBox extends Component {
    static propTypes = {
        label: PropTypes.string,
        onChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        inputPlaceholder: PropTypes.string,
    };

    static defaultProps = {
        label: 'Search notes',
        onChange: e => {
            console.log('SearchMenuInputBox - onChange');
        },
        onSubmit: e => {
            console.log('SearchMenuInputBox - onSubmit');
        },
    };

    constructor(props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = event => {
            const inputString = event.target.value;
            this.setState({ ...this.state, value: inputString });
            this.props.onChange(inputString);
        };

        this.handleSubmit = () => {
            this.props.onSubmit(this.state.value);
        };
    }

    render() {
        const { value } = this.state;

        return (
            <form onSubmit={this.handleSubmit}>
                <input
                    id="__search_menu_input__"
                    type="text"
                    value={value}
                    placeholder={this.props.inputPlaceholder}
                    onChange={this.handleChange}
                />
            </form>
        );
    }
}

class SearchNotesMenu extends Component {
    static propTypes = {
        onClickModalClose: PropTypes.func.isRequired,
        inputPlaceholder: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = { searchListItems: null };
    }

    render() {
        const onChange = inputString => {
            console.log('inputString =', inputString);
            const searchResults = searchNotesByName(inputString);

            // Create an element for each search result
            const searchListItems = searchResults.map(r => {
                return makeSearchMenuListItem(r.mainText, r.subText, r.key);
            });

            this.setState({ ...this.state, searchListItems });
        };

        const onSubmit = () => {
            console.log('Submit search not implemented yet. x)');
            this.setState({ ...this.state, searchListItems: null });
        };

        return (
            <aside className="searchmenu-modal-cover">
                <div className="searchmenu-modal">
                    <button className="searchmenu-close-btn" onClick={this.props.onClickModalClose}>
                        <span className="u-hide-visually">Close</span>
                        <svg className="searchmenu-modal-close-icon" viewBox="0 0 40 40">
                            <path d="M 10,10 L 30,30 M 30,10 L 10,30" />
                        </svg>
                    </button>
                    <SearchMenuInputBox
                        onChange={onChange}
                        onSubmit={onSubmit}
                        inputPlaceholder={this.props.inputPlaceholder}
                        className="searchmenu-input-box"
                    />
                    <ul className="searchmenu-list">{this.state.searchListItems}</ul>
                </div>
            </aside>
        );
    }
}

export class SearchNotesMenuModal extends Component {
    constructor(props) {
        super(props);

        this.state = { isOpen: false };

        this.setAsOpen = () => {
            this.setState({ ...this.state, isOpen: true });
        };

        this.setAsClosed = () => {
            console.log('Setting menu closed');
            this.setState({ ...this.state, isOpen: false });
        };
    }

    render() {
        const { buttonLabel, inputPlaceholder, disable } = this.props;

        const { isOpen } = this.state;

        if (disable) {
            return null;
        }

        return (
            <Fragment>
                <ModalTriggerButton label={buttonLabel} onClick={this.setAsOpen} />
                {!isOpen ? null : (
                    <SearchNotesMenu
                        inputPlaceholder={inputPlaceholder}
                        onClickModalClose={this.setAsClosed}
                    />
                )}
            </Fragment>
        );
    }
}
