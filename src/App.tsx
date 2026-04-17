import { Routes, Route, Navigate } from 'react-router-dom';
import Hub from './pages/Hub';
import CountryHome from './pages/CountryHome';
import { SportHome } from './pages/SportHome';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/country" element={<CountryHome />} />
      <Route path="/sport" element={<SportHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
