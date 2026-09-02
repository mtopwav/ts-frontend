import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './styles/components.css';
import './styles/mobile.css';
import './index.css';
import { initTheme } from './utils/theme';
import { getCurrentLanguage } from './utils/translations';
import { getSectionFromWindow } from './utils/settingsSection';
import App from './App';

initTheme();
document.documentElement.lang = getCurrentLanguage(getSectionFromWindow());

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

