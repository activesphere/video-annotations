import React from 'react';
import ReactDOM from 'react-dom';
import Remarkable from 'remarkable';

function rawMarkup(rawText) {
  let md = new Remarkable();
  let rawMarkup = md.render(rawText);
  return { __html: rawMarkup };
}

const Note = (props) => {
  return (
      <div className="note">
        <h3>{props.title}</h3>
        <div className="notearea">
          <p dangerouslySetInnerHTML={props.description} />
        </div>
      </div>    
  );
};

const Notes = (props) => {
  let notes = props.activeNotes.map((note) => {
    let desc = rawMarkup(note.description);
    return (<Note title={note.title}
                  description={desc}
                  key={note.id} />);
  });
  return (
      <div className="notes">{notes}</div>
  );
};

export default Notes;
