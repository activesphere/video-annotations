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

export const FooterMenu = ({ tabIndex, onChange }) => {
    return (
        <Paper>
            <Tabs
                value={tabIndex}
                onChange={onChange}
                indicatorColor="primary"
                textColor="primary"
                centered
            >
                <Tab label="Editor" />
                <Tab label="Saved notes" />
            </Tabs>
        </Paper>
    );
};
