import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Button, Menu } from '../button_icon_menu';

const StyledMenu = styled(Menu)`
    padding: 8px 7px 6px;
    position: absolute;
    z-index: 1;
    top: -10000px;
    left: -10000px;
    margin-top: -6px;
    opacity: 0;
    background-color: #222;
    border-radius: 4px;
    transition: opacity 0.75s;
`;

const createOnClickMark = ({ editor, type }) => event => {
    event.preventDefault();
    editor.toggleMark(type);
};

const renderMarkButton = (editor, type, markText) => {
    const { value } = editor;
    const isActive = value.activeMarks.some(mark => mark.type === type);

    return (
        <Button reversed active={isActive} onMouseDown={createOnClickMark({ editor, type })}>
            {markText}
        </Button>
    );
};

const HoverMenu = ({ editor, className, getRef }) => {
    const root = window.document.getElementById('__vid_annot_root__');

    return ReactDOM.createPortal(
        <StyledMenu
            className={className}
            ref={m => {
                getRef(m);
            }}
        >
            {renderMarkButton(editor, 'bold', <b>Bold</b>)}
            {renderMarkButton(editor, 'italic', <i>Italic</i>)}
            {renderMarkButton(
                editor,
                'underline',
                <span style={{ textDecoration: 'underline' }}>Underline</span>
            )}
            {renderMarkButton(editor, 'code', '<Code>')}
        </StyledMenu>,
        root
    );
};

export default HoverMenu;
