import "./styles.css";
import logo from "./logo.png";
import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="App">
      <h1>Hello Blazepack</h1>
      <h2>Start editing to see some magic happen!!!!</h2>
      <img src={logo} alt="codesandbox logo"/>
      <Link to="/about">Go to About</Link>
    </div>
  );
}
