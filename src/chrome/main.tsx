import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { ChromeApp } from './ChromeApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChromeApp />
  </StrictMode>,
);
