import React from 'react';
import Remarkable from 'remarkable';
import NotesTopBar from '../../containers/NotesTopBar/NotesTopBar';

import './Notes.less';

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

class Notes extends React.Component {
  constructor() {
    super();
    this.state = {
      searchQuery: '',
    };
    this.onSearchBoxChange = this.onSearchBoxChange.bind(this);
  }

  onSearchBoxChange(e) {
    this.setState({
      searchQuery: e.target.value.toLowerCase(),
    });
  }

  render() {
    const hasSearchQuery = (note, query) =>
      note.toLowerCase().indexOf(query) > -1;
    
    const notes = this.props.activeNotes.filter((note) =>
      hasSearchQuery(
        note.description,
        this.state.searchQuery
      )
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
          handleSearchBoxChange={this.onSearchBoxChange}
          searchString={this.state.searchQuery}
          activeNotesKey={this.props.activeNotesKey}
            
          showShareOption={this.props.showShareOption}
          showSearchBox={this.props.activeNotes.length > 0}
        />
        <div className="notes">{notes}</div>
      </div>
    );
  }
}

Notes.propTypes = {
  activeNotes: React.PropTypes.array.isRequired,
  activeNotesKey: React.PropTypes.string,
  showShareOption: React.PropTypes.bool,
  showSearchBox: React.PropTypes.bool,
};

Notes.defaultProps = {
  showShareOption: true,
};

export default Notes;
