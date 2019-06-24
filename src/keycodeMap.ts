import fromEntries from './utils/fromEntries';

const keycodeOfCommandName: { [s: string]: string } = {
  toggle_pause: 'Ctrl-p',
  mark_selection_as_timestamp: 'Ctrl-t',
  turn_text_to_timestamp: 'Ctrl-y',
  put_timestamp: 'Ctrl-Shift-t',
  seek_to_timestamp: 'Ctrl-g',
  capture_frame: 'Ctrl-i',
  debug_print: 'Ctrl-d',
};

const commandNameOfKeycode = fromEntries(
  Object.entries(keycodeOfCommandName).map(([cmd, keycode]) => [keycode, cmd])
);

export { commandNameOfKeycode };
