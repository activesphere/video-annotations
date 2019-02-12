import { createMuiTheme } from '@material-ui/core/styles';
import { blueGrey, purple } from '@material-ui/core/colors';

// Material-UI theme
export default createMuiTheme({
    palette: {
        primary: blueGrey,
        secondary: purple,
    },
    typography: {
        // Use the system font instead of the default Roboto font.
        fontFamily: ['"Noto Mono"'].join(','),
    },
});
