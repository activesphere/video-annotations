import React from 'react';
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
  const notes = props.activeNotes.map((note) => {
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
    <div className="notes">{notes}</div>
  );
};

Notes.propTypes = {
  activeNotes: React.PropTypes.array,
};


export default Notes;
