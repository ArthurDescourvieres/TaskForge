import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enregistré une fois pour toutes : sans ça, le bundler peut retirer useGSAP.
gsap.registerPlugin(useGSAP);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
