import { createMuiTheme } from '@material-ui/core/styles';
import { purple, lightBlue } from '@material-ui/core/colors';

// Material-UI theme
export default createMuiTheme({
    palette: {
        primary: lightBlue,
        secondary: purple,
    },
    typography: {
        // Use the system font instead of the default Roboto font.
        fontFamily: ['"Work Sans"'].join(','),
    },
});
