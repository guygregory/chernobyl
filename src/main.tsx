import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/atlas.css'

const root = document.getElementById('root')
if (!root) throw new Error('The application root is missing from index.html.')
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
