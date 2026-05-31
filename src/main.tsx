import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App.tsx'
import itemService from './services/itemService';
import {registerSW} from "./registerSW.ts";

registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Warm up items cache in background so engine can use /items metadata for compatibility
itemService.fetchItems().catch(() => {
  // ignore errors - engine will fall back to local build profiles
});