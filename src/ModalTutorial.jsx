// Doing a tutorial on making modal components

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';

const modalTriggerButtonStyle = {
    padding: '.1em .5em',
    color: '#4285f4',
    background: '#e2edff',
    border: '2px solid #bad2fa',
    borderRadius: '1em',
    cursor: 'pointer',
};

// Button that triggers the modal
const ModalTriggerButton = ({ label }) => (
    <button className="c-btn" style={modalTriggerButtonStyle}>
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
        width: '200px',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        translate: 'translate(-50%, -50%)',
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
        <aside className="c-modal-cover" style={modalCoverStyle}>
            <div className="c-modal" style={modalStyle}>
                <button className="c-modal__close" style={modalCloseStyle}>
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
                    {modalText ? modalText : null}
                </div>
            </div>
        </aside>
    );

    return ReactDOM.createPortal(modalElement, document.body);
};

export default class NewbModal extends Component {
    render() {
        const { buttonLabel, dontShowContent, modalText } = this.props;

        // <ModalTriggerButton label={buttonLabel} />

        return (
            <Fragment>{dontShowContent ? null : <ModalContent modalText={modalText} />}</Fragment>
        );
    }
}
