import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { initializeBrowserObservability } from './lib/browser-observability';

initializeBrowserObservability();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
