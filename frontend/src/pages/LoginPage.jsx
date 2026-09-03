import { Form, Input, Button, message } from 'antd';
import { login } from '../api/authApi';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            const userData = await login(values.email, values.password);
            localStorage.setItem('accessToken', userData.data.accessToken);
            navigate('/portfolio');
        } catch (error) {
            message.error(error.response?.data?.error?.message || '로그인 실패');
        }
    };

    return (
        <div className="sf-login-shell" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh', background: '#fff' }}>
            <div className="sf-login-hero" style={{ position: 'relative', background: '#0D1420', color: '#fff', padding: '52px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(820px 400px at 10% 6%, rgba(45,107,255,.24), transparent 62%)' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#2D6BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>S</div>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em' }}>StockFolio</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 440 }}>
                    <div style={{ fontSize: 38, lineHeight: 1.3, fontWeight: 700, letterSpacing: '-.035em' }}>흩어진 계좌를<br />하나의 수익률로.</div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.75, color: 'rgba(255,255,255,.6)' }}>
                        국내주식·해외주식·코인을 한 화면에서 추적하고, 실제 손익을 확인하세요.
                    </div>
                </div>
                <div style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,.35)' }}>© 2026 StockFolio · 투자 판단의 책임은 이용자 본인에게 있습니다</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                <div style={{ width: '100%', maxWidth: 376, display: 'flex', flexDirection: 'column', gap: 26 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-.03em' }}>다시 오신 걸 환영해요</div>
                        <div style={{ fontSize: 14, color: '#6B7686' }}>계정에 로그인하고 포트폴리오를 확인하세요.</div>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Form.Item name="email" label="이메일" rules={[{ required: true, message: '이메일을 입력해주세요' }]}>
                            <Input size="large" placeholder="이메일" style={{ height: 46, borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}>
                            <Input.Password size="large" placeholder="비밀번호" style={{ height: 46, borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                            <Button type="primary" htmlType="submit" size="large" block style={{ height: 48, borderRadius: 10, background: '#0D1420', border: 'none', fontWeight: 600 }}>
                                로그인
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: 'center', fontSize: 13.5, color: '#6B7686' }}>
                        아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
