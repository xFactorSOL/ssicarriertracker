import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ============================================
// Suppress MetaMask and wallet extension errors
// ============================================

// Override console.error to filter MetaMask errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (
    message.includes('MetaMask') ||
    message.includes('ethereum') ||
    message.includes('web3') ||
    message.includes('inpage.js')
  ) {
    return; // Silently ignore
  }
  originalConsoleError.apply(console, args);
};

// Suppress unhandled errors from MetaMask
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('MetaMask') ||
    event.message.includes('ethereum') ||
    event.message.includes('web3') ||
    event.message.includes('Failed to connect')
  )) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true);

// Suppress unhandled promise rejections from MetaMask
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  if (
    message.includes('MetaMask') ||
    message.includes('ethereum') ||
    message.includes('web3') ||
    message.includes('User rejected') ||
    message.includes('Failed to connect')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
}, true);

// Disable React error overlay for MetaMask errors in development
if (process.env.NODE_ENV === 'development') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      (typeof message === 'string' && message.includes('MetaMask')) ||
      (source && source.includes('inpage.js')) ||
      (error?.message && error.message.includes('MetaMask'))
    ) {
      return true; // Prevents the error from propagating
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
