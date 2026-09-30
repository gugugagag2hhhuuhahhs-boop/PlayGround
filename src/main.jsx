import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Mino butuh ref body global lebih awal
import { playerBodyRef } from './game/refs'
window.__playerBodyRef = playerBodyRef

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
