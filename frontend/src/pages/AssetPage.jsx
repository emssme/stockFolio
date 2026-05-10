import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Card, Space, Typography, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../api/assetApi';

const { Title } = Typography;

function AssetPage() {
    const [assets, setAssets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        getAssets().then(res => setAssets(res.data));
    }, []);

    const refreshAssets = () => getAssets().then(res => setAssets(res.data));

    const handleOpenCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
        setEditingAsset(null);
    };

    const handleOpenEdit = (asset) => {
        form.setFieldsValue(asset);
        setIsModalOpen(true);
        setEditingAsset(asset);
    };

    const handleDelete = async (id) => {
        await deleteAsset(id);
        await refreshAssets();
    };

    const handleSubmit = async (values) => {
        if (editingAsset == null) {
            await createAsset(values);
        } else {
            await updateAsset(editingAsset.id, values);
        }
        setIsModalOpen(false);
        await refreshAssets();
    };

    const columns = [
        { title: '자산명', dataIndex: 'name' },
        { title: '티커', dataIndex: 'ticker' },
        { title: '종류', dataIndex: 'assetType' },
        { title: '수량', dataIndex: 'quantity' },
        { title: '평균단가', dataIndex: 'avgPurchasePrice', render: v => Number(v).toLocaleString() },
        {
            title: '관리',
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => handleOpenEdit(record)}>수정</Button>
                    <Popconfirm
                        title="정말 삭제하시겠습니까?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="삭제"
                        cancelText="취소"
                    >
                        <Button size="small" danger>삭제</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>자산 관리</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>자산 등록</Button>
            </div>

            <Card>
                <Table dataSource={assets} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
            </Card>

            <Modal
                title={editingAsset ? '자산 수정' : '자산 등록'}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
                okText={editingAsset ? '수정' : '등록'}
                cancelText="취소"
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item name="assetType" label="자산 종류" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="STOCK_KR">국내주식</Select.Option>
                            <Select.Option value="STOCK_US">해외주식</Select.Option>
                            <Select.Option value="CRYPTO">코인</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="ticker" label="티커" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="자산명" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="currency" label="통화" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="KRW">KRW</Select.Option>
                            <Select.Option value="USD">USD</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="exchange" label="거래소 (해외주식만)">
                        <Input placeholder="예: NYS, NAS" />
                    </Form.Item>
                    <Form.Item name="quantity" label="수량" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="avgPurchasePrice" label="평균단가" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

export default AssetPage;
