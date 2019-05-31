import { createMuiTheme } from '@material-ui/core/styles';
import { purple, teal } from '@material-ui/core/colors';

// Material-UI theme
export default createMuiTheme({
    palette: {
        primary: teal,
        secondary: purple,
    },
    typography: {
        // Use the system font instead of the default Roboto font.
        fontFamily: ['"Noto Mono"'].join(','),
    },
});
