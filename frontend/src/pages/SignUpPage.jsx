import { Form, Input, Button, Card, Typography, message } from 'antd';
import { signup } from '../api/authApi';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, color: '#1677ff' }}>StockFolio</Title>
                    <Text type="secondary">회원가입</Text>
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
                        <Input size="large" placeholder="이메일" />
                    </Form.Item>
                    <Form.Item
                        name="nickname"
                        label="이름"
                        rules={[
                            { required: true, message: '이름을 입력해주세요' },
                            { min: 2, max: 50, message: '이름은 2자 이상 50자 이하여야 합니다' }
                        ]}
                    >
                        <Input size="large" placeholder="이름 (2자 이상)" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="비밀번호"
                        rules={[
                            { required: true, message: '비밀번호를 입력해주세요' },
                            { min: 8, message: '비밀번호는 8자 이상이어야 합니다' }
                        ]}
                    >
                        <Input.Password size="large" placeholder="비밀번호 (8자 이상)" />
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
                        <Input.Password size="large" placeholder="비밀번호 확인" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                        <Button type="primary" htmlType="submit" size="large" block>
                            회원가입
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">이미 계정이 있으신가요? </Text>
                    <Link to="/login">로그인</Link>
                </div>
            </Card>
        </div>
    );
}

export default SignUpPage;
