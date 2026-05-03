import { Form, Input, Button, message } from 'antd';
import { login } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const navigate = useNavigate();
    const onFinish = async (values) => {
        try {
            const userData = await login(values.email, values.password);
            // 로그인 성공 시 accessToken을 localStorage에 저장
            localStorage.setItem('accessToken', userData.accessToken);
            // 로그인 성공 후 포트폴리오 페이지로 이동
            navigate('/portfolio');
        } catch (error) {
            message.error(error.response?.data?.error?.message || '로그인 실패');
        }
    };

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="email" rules={[{ required: true, message: '이메일을 입력해주세요' }]}>
        <Input placeholder="email" />
      </Form.Item>

      <Form.Item name="password" rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}>
        <Input.Password placeholder="비밀번호" />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        로그인
      </Button>
    </Form>
  );
}

export default LoginPage;
