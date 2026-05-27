import { Form, Input, Button, Card, Typography, message } from 'antd';
import { login } from '../api/authApi';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, color: '#1677ff' }}>StockFolio</Title>
                    <Text type="secondary">실시간 포트폴리오 트래커</Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="email" label="이메일" rules={[{ required: true, message: '이메일을 입력해주세요' }]}>
                        <Input size="large" placeholder="이메일" />
                    </Form.Item>
                    <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}>
                        <Input.Password size="large" placeholder="비밀번호" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                        <Button type="primary" htmlType="submit" size="large" block>
                            로그인
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">계정이 없으신가요? </Text>
                    <Link to="/signup">회원가입</Link>
                </div>
            </Card>
        </div>
    );
}

export default LoginPage;
