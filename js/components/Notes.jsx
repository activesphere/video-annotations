import React from 'react';
import SearchBox from './SearchBox';
import Remarkable from 'remarkable';


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
      <SearchBox
        which="noteSearchBox"
        handleSearchBoxChange={props.handleSearchBoxChange}
        searchString={props.searchQuery}
        placeholder="Notes are shown below, type to search through them"
      />
      <div className="notes">{notes}</div>
    </div>
  );
};

Notes.propTypes = {
  activeNotes: React.PropTypes.array,
  handleSearchBoxChange: React.PropTypes.func.isRequired,
  searchQuery: React.PropTypes.string.isRequired,
};


export default Notes;
