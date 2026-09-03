import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUi } from '../context/UiContext';
import AssetModal from './AssetModal';

const NAV_ITEMS = [
    { key: '/portfolio', label: '포트폴리오' },
    { key: '/assets', label: '자산 관리' },
];

const PAGE_TITLES = {
    '/portfolio': '포트폴리오',
    '/assets': '자산 관리',
};

function useKrxStatus() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);
    const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const isOpen = day >= 1 && day <= 5 && minutes >= 9 * 60 && minutes <= 15 * 60 + 30;
    return { time, isOpen };
}

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, masked, toggleTheme, toggleMasked, openAssetModal } = useUi();
    const { time, isOpen } = useKrxStatus();

    const pageTitle = PAGE_TITLES[location.pathname] || '포트폴리오';

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    return (
        <div id="sf-app-root" data-sf-root="" data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--t1)', transition: 'background .2s' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--nav)', color: 'var(--navT)' }}>
                <div data-sf="navbar" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>S</div>
                        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>StockFolio</span>
                    </div>
                    <div data-sf="navscroll" style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', minWidth: 0 }}>
                        {NAV_ITEMS.map((n) => {
                            const on = location.pathname === n.key;
                            return (
                                <div
                                    key={n.key}
                                    onClick={() => navigate(n.key)}
                                    className="sf-navitem"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8,
                                        background: on ? 'rgba(255,255,255,.11)' : 'transparent',
                                        color: on ? '#FFFFFF' : 'var(--navD)',
                                        fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .15s',
                                    }}
                                    onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--navH)'; }}
                                    onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {n.label}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flex: 'none' }}>
                        <div data-sf="navuser" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.14)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 27, height: 27, borderRadius: '50%', background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                    {(localStorage.getItem('accessToken') ? '나' : '?')}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="sf-btn"
                            style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.42)', fontSize: 11.5, cursor: 'pointer', padding: 4 }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <header data-sf="padx" style={{ position: 'sticky', top: 56, zIndex: 30, background: 'var(--bg)', borderBottom: '1px solid var(--bd)', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.025em', flex: 'none', whiteSpace: 'nowrap' }}>{pageTitle}</span>
                        <div data-sf="statuspill" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 99, background: 'var(--surf)', border: '1px solid var(--bd)', flex: 'none' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#12A150', animation: 'sfPulse 2s ease-in-out infinite' }} />
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t2)' }}>{isOpen ? '장중' : '장마감'} · KRX {time}</span>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
                            <div data-sf="search" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 9, width: 228, flex: 'none' }}>
                                <span style={{ width: 12, height: 12, border: '1.6px solid var(--t4)', borderRadius: '50%', flex: 'none' }} />
                                <input placeholder="종목·티커 검색" style={{ border: 'none', background: 'transparent', fontSize: 13.5, width: '100%', color: 'var(--t1)', outline: 'none' }} />
                            </div>
                            <button onClick={toggleMasked} title="금액 가리기" className="sf-btn" style={{ flex: 'none', width: 36, height: 36, background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 9, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                                {masked ? '◌' : '◍'}
                            </button>
                            <button onClick={toggleTheme} title="테마" className="sf-btn" style={{ flex: 'none', width: 36, height: 36, background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 9, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                                {theme === 'dark' ? '☾' : '☀'}
                            </button>
                            <button
                                data-sf="registerbtn"
                                onClick={() => openAssetModal()}
                                style={{ flex: 'none', whiteSpace: 'nowrap', height: 36, padding: '0 14px', background: 'var(--nav)', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity .15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.88; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 400 }}>+</span>
                                <span data-sf="registerlabel">자산 등록</span>
                            </button>
                        </div>
                    </header>

                    <div data-sf="pad" data-sf-px="" style={{ padding: '22px 28px 44px', display: 'flex', flexDirection: 'column', gap: 'var(--gap)', animation: 'sfFade .3s ease both' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            <AssetModal />
        </div>
    );
}

export default MainLayout;
