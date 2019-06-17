const keycodeOfCommandName = {
  toggle_pause: 'Ctrl-p',
  mark_selection_as_timestamp: 'Ctrl-t',
  put_timestamp: 'Ctrl-Shift-t',
  seek_to_timestamp: 'Ctrl-g',
  capture_frame: 'Ctrl-i',
};

const commandNameOfKeycode = Object.fromEntries(
  Object.entries(keycodeOfCommandName).map(([commandName, keycode]) => [keycode, commandName])
);

export { keycodeOfCommandName, commandNameOfKeycode };
