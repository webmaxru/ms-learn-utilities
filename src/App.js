import TotalTime from './TotalTime.js';
import About from './About.js';
import './App.css';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';

  return (
    <Router>
      <header>
        <h1>
          <Link to="/">MS Learn Utilities</Link>
        </h1>
        <Link to="/about" className="about">
          &#63;
        </Link>
      </header>
      <div className="body">
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/">
            <TotalTime isDebug={isDebug}></TotalTime>
          </Route>
        </Switch>

        <nav className="nav"></nav>
        <aside className="ads"></aside>
      </div>
      <footer>
        {!isDebug ? (
          <p>
            Made in 🇳🇴&nbsp; by&nbsp;
            <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a> |&nbsp;
            <a href="https://github.com/webmaxru/ms-learn-utilities">GitHub</a>
          </p>
        ) : (
          <p>Debugging mode</p>
        )}
      </footer>
    </Router>
  );
}

export default App;
