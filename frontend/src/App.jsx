import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PortfolioPage from './pages/PortfolioPage';
import AssetPage from './pages/AssetPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/assets" element={<AssetPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
