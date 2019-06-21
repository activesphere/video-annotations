import { createMuiTheme } from '@material-ui/core/styles';
import { purple, red } from '@material-ui/core/colors';

// Material-UI theme
export default createMuiTheme({
  palette: {
    primary: red,
    secondary: purple,
  },
  typography: {
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});
