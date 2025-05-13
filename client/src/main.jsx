import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './bootstrap-custom.css' // Import Bootstrap CSS first
import './index.css'
import App from './App.jsx'

// Add Remix Icons
const remixIconsLink = document.createElement('link');
remixIconsLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
remixIconsLink.rel = 'stylesheet';
document.head.appendChild(remixIconsLink);

// Add Inter font
const interFontLink = document.createElement('link');
interFontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
interFontLink.rel = 'stylesheet';
document.head.appendChild(interFontLink);

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
