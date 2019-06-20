import * as React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

export const SnackbarContext = React.createContext({});

interface ButtonProps {
  size: string;
  onClick: (e: any) => void;
}

const DismissButton = ({ size, ...restProps }: ButtonProps) => {
  if (size === 'small') {
    return (
      <IconButton key="close" aria-label="Close" color="inherit" {...restProps}>
        <CloseIcon />
      </IconButton>
    );
  }

  return (
    <Button color="secondary" size="small" {...restProps}>
      Dismiss
    </Button>
  );
};

interface SnackbarState {
  open: boolean;
  message: string;
  id: string;
  autoHide: boolean;
  autoHideDuration: number | undefined;
  dismissable: boolean;
  action: () => {};
}

export class SnackbarContextProvider extends React.Component {
  state = {
    open: false,
    message: '',
    id: '',
    action: null,
    autoHide: true,
    autoHideDuration: 3000,
    dismissable: true,
  };

  openSnackbar = ({
    message,
    id,
    action,
    autoHide,
    autoHideDuration,
    dismissable,
  }: SnackbarState) => {
    this.setState({
      open: true,
      message,
      id,
      action,
      autoHide: autoHide !== false,
      autoHideDuration,
      dismissable,
    });
  };

  closeSnackbar = (_event: any) => {
    this.setState({ open: false });
  };

  render() {
    const { id, action } = this.state;
    const defaultAutoHideDuration = 6000;

    return (
      <SnackbarContext.Provider
        value={{
          ...this.state,
          openSnackbar: this.openSnackbar,
          closeSnackbar: this.closeSnackbar,
        }}
      >
        <Snackbar
          key={id}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={this.state.open}
          autoHideDuration={
            this.state.autoHide ? this.state.autoHideDuration || defaultAutoHideDuration : void 0
          }
          onClose={this.closeSnackbar}
          ContentProps={{
            'aria-describedby': id,
          }}
          message={<span id={id}>{this.state.message}</span>}
          action={[
            action ? (
              <span key="snackbar-action" onClick={this.closeSnackbar}>
                {action}
              </span>
            ) : null,
            <DismissButton
              key="snackbar-dismiss-button"
              size={action ? 'small' : 'large'}
              onClick={this.closeSnackbar}
            />,
          ]}
        />

        {this.props.children}
      </SnackbarContext.Provider>
    );
  }
}

export const SnackbarContextConsumer = SnackbarContext.Consumer;
