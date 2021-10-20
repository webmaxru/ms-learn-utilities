import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4';

ReactGA.initialize('G-B5KDVTEYLP');
ReactGA.send('pageview');

ReactDOM.render(<App />, document.getElementById('root'));

const sendToAnalytics = ({ id, name, value }) => {
  ReactGA.event({
    category: 'Web Vitals',
    action: name,
    label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    nonInteraction: true, // optional, true/false
    transport: 'xhr', // optional, beacon/xhr/image
  });
};

reportWebVitals(sendToAnalytics);
