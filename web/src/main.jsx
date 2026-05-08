import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';
import './styles/app.css';
import './styles/extras.css';
import Landing from './pages/Landing.jsx';
import Expositor from './pages/Expositor.jsx';
import Contacto from './pages/Contacto.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { TweaksProvider } from './tweaks/TweaksContext.jsx';
import TweaksPanel from './tweaks/TweaksPanel.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TweaksProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/expositor" element={<Expositor />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<Landing />} />
        </Routes>
        <TweaksPanel />
      </BrowserRouter>
    </TweaksProvider>
  </React.StrictMode>,
);
