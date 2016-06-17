import React from 'react';
import Remarkable from 'remarkable';
import NotesTopBar from '../containers/NotesTopBar/NotesTopBar';


function rawMarkup(rawText) {
  const md = new Remarkable();
  return { __html: md.render(rawText) };
}

const Note = (props) => (
  <div className="note">
    <h3>{props.title}</h3>
    <div className="notearea">
      <p dangerouslySetInnerHTML={props.description} />
    </div>
  </div>
);

Note.propTypes = {
  title: React.PropTypes.string,
  description: React.PropTypes.object,
};


const Notes = (props) => {
  const notes = props.activeNotes.filter((note) =>
    note.description.indexOf(props.searchQuery) > -1
  ).map((note) => {
    const desc = rawMarkup(note.description);
    return (
      <Note
        title={note.title}
        description={desc}
        key={note.id}
      />
    );
  });

  return (
    <div className="notes-holder">
      <NotesTopBar
        handleSearchBoxChange={props.handleSearchBoxChange}
        searchString={props.searchQuery}
        activeNotesKey={props.activeNotesKey}
      />
      <div className="notes">{notes}</div>
    </div>
  );
};

Notes.propTypes = {
  activeNotes: React.PropTypes.array,
  activeNotesKey: React.PropTypes.string.isRequired,
  handleSearchBoxChange: React.PropTypes.func.isRequired,
  searchQuery: React.PropTypes.string,
};


export default Notes;
