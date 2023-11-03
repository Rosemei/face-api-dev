import React from "react";
import Capture from "components/Capture";
import { ThemeProvider, createTheme, makeStyles } from '@material-ui/core/styles';

const theme = createTheme();

const useStyles = makeStyles((theme) => {
  root: {
    // some CSS that accesses the theme
  }
});
function App() {
  return (
    <ThemeProvider theme={theme}>
    <div className="App">
     <Capture /> 
    </div>
    </ThemeProvider>
  );
}

export default App;
