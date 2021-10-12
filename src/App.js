import TotalTime from './TotalTime.js';
import Catalog from './Catalog.js';
import About from './About.js';
import './App.css';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Workbox } from 'workbox-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const query = new URLSearchParams(window.location.search);
  const isDebug = query.get('debug') === 'true';

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');

      const refreshPage = () => {
        wb.addEventListener('controlling', (event) => {
          window.location.reload();
        });

        wb.messageSkipWaiting();
      };

      const Msg = (props) => (
        <div>
          Updated {props.type.toString()} is available&nbsp;&nbsp;
          <button onClick={refreshPage}>Reload</button>
        </div>
      );

      const showSkipWaitingPrompt = (type) => {
        toast.info(<Msg type={type} />);
      };

      wb.addEventListener('waiting', () => showSkipWaitingPrompt('app'));

      wb.addEventListener('message', (event) => {
        if (!event.data) {
          return;
        }

        if (event.data.meta === 'workbox-broadcast-update') {
          showSkipWaitingPrompt('catalog data');
        }

        if (event.data.type === 'REQUEST_FAILED') {
          toast.warning(
            'No network connection. Using stored catalog data (might be outdated).'
          );
        }
      });

      wb.register();
    }
  }, []);

  return (
    <Router>
      <header>
        <h1>
          <Link to="/">MS Learn Navigator</Link>
        </h1>

        {/*
        <a href="/" className="menu">
          Module Navigator
        </a>
                 <a href="/total-time" className="menu">
          Total Time
        </a> */}

        <Link to="/about" className="about">
          &#63;
        </Link>
      </header>
      <div className="body">
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/total-time">
            <TotalTime isDebug={isDebug}></TotalTime>
          </Route>
          <Route path="/">
            <Catalog isDebug={isDebug}></Catalog>
          </Route>
        </Switch>
      </div>
      <footer>
        {!isDebug ? (
          <p>
            Made in Norway by&nbsp;
            <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a> |&nbsp;
            <a href="https://github.com/webmaxru/ms-learn-utilities">GitHub</a>
          </p>
        ) : (
          <p>Debugging mode</p>
        )}
      </footer>
      <ToastContainer />
    </Router>
  );
}

export default App;
