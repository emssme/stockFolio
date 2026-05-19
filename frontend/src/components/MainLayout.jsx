import { useState } from 'react';
import { Layout, Menu, Button, Drawer, Grid } from 'antd';
import { FundOutlined, AppstoreOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Sider, Content, Header } = Layout;
const { useBreakpoint } = Grid;

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [drawerOpen, setDrawerOpen] = useState(false);

    const menuItems = [
        { key: '/portfolio', icon: <FundOutlined />, label: '포트폴리오' },
        { key: '/assets', icon: <AppstoreOutlined />, label: '자산 관리' },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
        setDrawerOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    const sideContent = (
        <>
            <div style={{ padding: '20px 24px', color: 'white', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                StockFolio
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{ marginTop: 8 }}
            />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '16px' }}>
                <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{ color: 'rgba(255,255,255,0.65)', width: '100%', textAlign: 'left' }}
                >
                    로그아웃
                </Button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ background: '#001529', display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', position: 'sticky', top: 0, zIndex: 100 }}>
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={() => setDrawerOpen(true)}
                        style={{ color: 'white' }}
                    />
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>StockFolio</span>
                </Header>
                <Drawer
                    placement="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    styles={{ body: { padding: 0, background: '#001529' }, wrapper: { width: 200 } }}
                    title={null}
                    closable={false}
                >
                    {sideContent}
                </Drawer>
                <Content style={{ padding: 16, background: '#f0f2f5' }}>
                    <Outlet />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider theme="dark" width={200} style={{ position: 'fixed', height: '100vh', left: 0, zIndex: 100 }}>
                {sideContent}
            </Sider>
            <Layout style={{ marginLeft: 200 }}>
                <Content style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}

export default MainLayout;
