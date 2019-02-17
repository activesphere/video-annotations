import React from 'react';
import { AppBar, Toolbar, Typography, Paper, Tabs, Tab } from '@material-ui/core';

export const AppHeader = props => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="display1" color="inherit" gutterBottom={true}>
                    Annotator
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export const FooterMenu = () => {
    const onChange = (_e, value) => {
        window.history.pushState(null, '', value);
    };

    return (
        <Paper>
            <Tabs onChange={onChange} indicatorColor="primary" textColor="primary" centered>
                <Tab value="/editor" label="Editor" />
                <Tab value="/saved_notes" label="Saved notes" />
            </Tabs>
        </Paper>
    );
};
