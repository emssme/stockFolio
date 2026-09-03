import { ConfigProvider, theme as antdTheme } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PortfolioPage from './pages/PortfolioPage';
import AssetPage from './pages/AssetPage';
import MainLayout from './components/MainLayout';
import { UiProvider, useUi } from './context/UiContext';

const FONT_FAMILY = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function ThemedApp() {
    const { theme } = useUi();

    return (
        <ConfigProvider
            theme={{
                algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#2D6BFF',
                    colorError: '#E5484D',
                    borderRadius: 10,
                    fontFamily: FONT_FAMILY,
                    colorBgLayout: theme === 'dark' ? '#0A0E15' : '#F2F4F7',
                },
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route element={<MainLayout />}>
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/assets" element={<AssetPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

function App() {
    return (
        <UiProvider>
            <ThemedApp />
        </UiProvider>
    );
}

export default App;
