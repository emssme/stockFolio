import { Form, Input, Button, message } from 'antd';
import { signup } from '../api/authApi';
import { useNavigate, Link } from 'react-router-dom';

function SignUpPage() {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            await signup(values.email, values.password, values.nickname);
            message.success('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            message.error(error.response?.data?.error?.message || '회원가입 실패');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F2F4F7' }}>
            <div style={{ width: '100%', maxWidth: 376, display: 'flex', flexDirection: 'column', gap: 26, background: '#fff', padding: '40px 36px', borderRadius: 16, boxShadow: '0 1px 2px rgba(16,24,40,.05)', border: '1px solid #E5E8EE' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#2D6BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>S</div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em' }}>StockFolio</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.03em' }}>회원가입</div>
                    <div style={{ fontSize: 14, color: '#6B7686' }}>계정을 만들고 포트폴리오 관리를 시작하세요.</div>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="email"
                        label="이메일"
                        rules={[
                            { required: true, message: '이메일을 입력해주세요' },
                            { type: 'email', message: '이메일 형식이 올바르지 않습니다' }
                        ]}
                    >
                        <Input size="large" placeholder="이메일" style={{ height: 46, borderRadius: 10 }} />
                    </Form.Item>
                    <Form.Item
                        name="nickname"
                        label="이름"
                        rules={[
                            { required: true, message: '이름을 입력해주세요' },
                            { min: 2, max: 50, message: '이름은 2자 이상 50자 이하여야 합니다' }
                        ]}
                    >
                        <Input size="large" placeholder="이름 (2자 이상)" style={{ height: 46, borderRadius: 10 }} />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="비밀번호"
                        rules={[
                            { required: true, message: '비밀번호를 입력해주세요' },
                            { min: 8, message: '비밀번호는 8자 이상이어야 합니다' }
                        ]}
                    >
                        <Input.Password size="large" placeholder="비밀번호 (8자 이상)" style={{ height: 46, borderRadius: 10 }} />
                    </Form.Item>
                    <Form.Item
                        name="passwordConfirm"
                        label="비밀번호 확인"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '비밀번호를 다시 입력해주세요' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                                }
                            })
                        ]}
                    >
                        <Input.Password size="large" placeholder="비밀번호 확인" style={{ height: 46, borderRadius: 10 }} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                        <Button type="primary" htmlType="submit" size="large" block style={{ height: 48, borderRadius: 10, background: '#0D1420', border: 'none', fontWeight: 600 }}>
                            회원가입
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', fontSize: 13.5, color: '#6B7686' }}>
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;
