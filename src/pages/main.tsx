import { StrictMode, useEffect, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { useT } from '../lib/bridge';
import { Bookmarks } from './Bookmarks';
import { ErrorPage } from './ErrorPage';
import { History } from './History';
import { NewTab } from './NewTab';
import { Settings } from './Settings';

const PAGES: Record<string, () => ReactElement> = {
  newtab: NewTab,
  settings: Settings,
  history: History,
  bookmarks: Bookmarks,
  error: ErrorPage,
};

const TITLES: Record<string, 'tab.new' | 'settings.title' | 'history.title' | 'menu.bookmarks' | 'error.load.title'> = {
  newtab: 'tab.new',
  settings: 'settings.title',
  history: 'history.title',
  bookmarks: 'menu.bookmarks',
  error: 'error.load.title',
};

function App() {
  const t = useT();
  // In a plain browser (design preview) the page comes from ?page=; inside Electron it is the tekeli:// host.
  const host = location.protocol === 'tekeli:' ? location.hostname : new URLSearchParams(location.search).get('page') ?? 'newtab';
  const Page = PAGES[host] ?? NewTab;
  useEffect(() => { const key = TITLES[host]; if (key && host !== 'error') document.title = t(key); }, [host, t]);
  return <Page />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
