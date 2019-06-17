import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { SnackbarContextProvider } from './context/SnackbarContext';
import Main from './Main';
import AppConfig from './AppConfig';
import theme from './mui_theme';

import useLoadYTAPI from './useLoadYTAPI';

const App = () => {
    const { ytAPI } = useLoadYTAPI();

    return (
        <MuiThemeProvider theme={theme}>
            <SnackbarContextProvider>
                <Main ytAPI={ytAPI} />
            </SnackbarContextProvider>
        </MuiThemeProvider>
    );
};

ReactDOM.render(<App />, document.getElementById(AppConfig.VidAnnotRootId));
