import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode removed - causes double mounting issues with webview
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
