import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './assets/css/style.css';
import Dashboard from './pages/dashboard';
import Rooms_List from './pages/Rooms/list';
import Tenants_List from './pages/Tenants/tenantsList';
import PaymentHistory_List from './pages/payHistory/payHistoryList';
import Login from './pages/Login';
import Settings from './pages/Settings/settings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms information" element={<Rooms_List />} />
        <Route path="/tenants information" element={<Tenants_List />} />
        <Route path="/history information" element={<PaymentHistory_List />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);