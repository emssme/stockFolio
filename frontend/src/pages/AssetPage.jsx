import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber } from 'antd';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../api/assetApi';

function AssetPage() {
    const [assets, setAssets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        getAssets().then(res => setAssets(res.data));
    }, []);


    const handleOpenCreate = () => {
        // 등록 모달 열기
        form.resetFields();
        setIsModalOpen(true);
        setEditingAsset(null);
    };

    const handleOpenEdit = (asset) => {
        // 수정 모달 열기
        form.setFieldsValue(asset);
        setIsModalOpen(true);
        setEditingAsset(asset);
    };

    const handleDelete = async (id) => {
        // 삭제
        await deleteAsset(id);
        await getAssets().then(res => setAssets(res.data));
    };

    const handleSubmit = async (values) => {
        // 등록 또는 수정 분기
        if(editingAsset == null) {
            await createAsset(values);
        } else {
            await updateAsset(editingAsset.id, values);
        }
        setIsModalOpen(false);
        await getAssets().then(res => setAssets(res.data));
    };

    const columns = [
        { title: '자산명', dataIndex: 'name' },
        { title: '티커', dataIndex: 'ticker' },
        { title: '종류', dataIndex: 'assetType' },
        { title: '수량', dataIndex: 'quantity' },
        { title: '평균단가', dataIndex: 'avgPurchasePrice' },
        {
            title: '관리',
            render: (_, record) => (
                <>
                    <Button onClick={() => handleOpenEdit(record)}>수정</Button>
                    <Button danger onClick={() => handleDelete(record.id)}>삭제</Button>
                </>
            ),
        },
    ];

    return (
        <>
            <Button type="primary" onClick={handleOpenCreate}>자산 등록</Button>

            <Table dataSource={assets} columns={columns} rowKey="id" />

            <Modal
                title={editingAsset ? '자산 수정' : '자산 등록'}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
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
