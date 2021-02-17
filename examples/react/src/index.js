import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from 'react-router-dom';
import About from './About';
import App from "./App";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <BrowserRouter>
      <Route path="/" exact={true}>
        <App />
      </Route>
      <Route path="/about">
        <About />
      </Route>
    </BrowserRouter>
  </StrictMode>,
  rootElement
);
