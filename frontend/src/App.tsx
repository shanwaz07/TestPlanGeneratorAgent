import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ToastProvider } from './components/ui/Toast';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/history"  element={<History />}   />
            <Route path="/settings" element={<Settings />}  />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
