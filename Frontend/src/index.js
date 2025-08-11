import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Using HashRouter to avoid 404 errors on page refresh without server rewrite rules
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);

reportWebVitals();
