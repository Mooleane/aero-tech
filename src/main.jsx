import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Router from './routes.jsx'

// Apply dark mode on initial load
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
  document.body.classList.add('dark-mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
		<BrowserRouter>
      <Router />
		</BrowserRouter>
  </StrictMode>,
)
