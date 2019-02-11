import React, { Component } from 'react';
import { AppBar, Toolbar, Typography, Paper, Tabs, Tab } from "@material-ui/core";

export const AppHeader = (props) => {
    return <AppBar position="static">
        <Toolbar>
            <Typography variant="display1" color="inherit" gutterBottom={true}>
                Annotator
            </Typography>
        </Toolbar>
    </AppBar>;
};

export const FooterMenu = ({ value = 0, onChange = () => { } }) => {
    return <Paper>
        <Tabs
            value={value}
            onChange={onChange}
            indicatorColor="primary"
            textColor="primary"
            centered
        >
            <Tab label="Take notes" />
            <Tab label="Saved notes" />
            <Tab label="Just watch video" />
        </Tabs>
    </Paper>;
};
