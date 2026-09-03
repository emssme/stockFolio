import { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createAsset, updateAsset } from '../api/assetApi';
import { useUi } from '../context/UiContext';

const ASSET_KINDS = [
    { value: 'STOCK_KR', label: '국내주식' },
    { value: 'STOCK_US', label: '해외주식' },
    { value: 'CRYPTO', label: '코인' },
];

const CURRENCIES = [
    { value: 'KRW', label: 'KRW' },
    { value: 'USD', label: 'USD' },
];

const unitLabel = (currency) => (currency === 'USD' ? '달러' : '원');

function PillGroup({ options, value, onChange, disabled, columns }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 7 }}>
            {options.map((opt) => {
                const on = opt.value === value;
                return (
                    <div
                        key={opt.value}
                        onClick={() => !disabled && onChange(opt.value)}
                        style={{
                            height: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: disabled ? 'default' : 'pointer',
                            opacity: disabled && !on ? 0.5 : 1,
                            background: on ? 'var(--dnBg)' : 'var(--surf)',
                            color: on ? 'var(--acc)' : 'var(--t2)',
                            border: `1px solid ${on ? 'var(--acc)' : 'var(--bd)'}`,
                            transition: 'all .15s',
                        }}
                    >
                        {opt.label}
                    </div>
                );
            })}
        </div>
    );
}

const fieldLabelStyle = { fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 7 };
const inputStyle = { height: 46, borderRadius: 10, fontSize: 15 };

function AssetModal() {
    const { modalState, closeAssetModal, bumpAssetsVersion } = useUi();
    const { open, editingAsset } = modalState;
    const [form] = Form.useForm();
    const assetType = Form.useWatch('assetType', form);
    const currency = Form.useWatch('currency', form);
    const isEditing = editingAsset != null;

    useEffect(() => {
        if (!open) return;
        if (editingAsset) {
            form.setFieldsValue(editingAsset);
        } else {
            form.resetFields();
            form.setFieldsValue({ assetType: 'STOCK_KR', currency: 'KRW' });
        }
    }, [open, editingAsset, form]);

    const handleSubmit = async (values) => {
        try {
            if (isEditing) {
                await updateAsset(editingAsset.id, values);
                message.success('자산이 수정되었습니다.');
            } else {
                await createAsset(values);
                message.success('자산이 등록되었습니다.');
            }
            closeAssetModal();
            bumpAssetsVersion();
        } catch (err) {
            message.error(err.response?.data?.error?.message || '처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <Modal
            open={open}
            onCancel={closeAssetModal}
            footer={null}
            closable={false}
            width={640}
            getContainer={() => document.getElementById('sf-app-root') || document.body}
            styles={{ content: { padding: 0, borderRadius: 18, overflow: 'hidden' } }}
        >
            <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid var(--bd2)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.025em' }}>{isEditing ? '자산 수정' : '자산 등록'}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>보유 중인 종목과 평균단가를 입력하면 수익률이 자동으로 계산됩니다.</span>
                </div>
                <div
                    onClick={closeAssetModal}
                    style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 16, cursor: 'pointer', flex: 'none' }}
                    className="sf-btn"
                >
                    ✕
                </div>
            </div>

            <Form form={form} onFinish={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <span style={fieldLabelStyle}>자산 종류</span>
                    <Form.Item name="assetType" noStyle rules={[{ required: true }]}>
                        <PillGroup
                            options={ASSET_KINDS}
                            value={assetType}
                            onChange={(v) => form.setFieldValue('assetType', v)}
                            disabled={isEditing}
                            columns={3}
                        />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                        <span style={fieldLabelStyle}>티커 *</span>
                        <Form.Item name="ticker" noStyle rules={[{ required: true, message: '티커를 입력해주세요' }]}>
                            <Input style={inputStyle} disabled={isEditing} placeholder="예: 005930" />
                        </Form.Item>
                    </div>
                    <div>
                        <span style={fieldLabelStyle}>자산명 *</span>
                        <Form.Item name="name" noStyle rules={[{ required: true, message: '자산명을 입력해주세요' }]}>
                            <Input style={inputStyle} disabled={isEditing} placeholder="예: 삼성전자" />
                        </Form.Item>
                    </div>
                </div>

                <div>
                    <span style={fieldLabelStyle}>통화</span>
                    <Form.Item name="currency" noStyle rules={[{ required: true }]}>
                        <PillGroup
                            options={CURRENCIES}
                            value={currency}
                            onChange={(v) => form.setFieldValue('currency', v)}
                            disabled={isEditing}
                            columns={2}
                        />
                    </Form.Item>
                </div>

                {assetType === 'STOCK_US' && (
                    <div>
                        <span style={fieldLabelStyle}>거래소 (해외주식)</span>
                        <Form.Item name="exchange" noStyle>
                            <Input style={inputStyle} disabled={isEditing} placeholder="예: NYS, NAS" />
                        </Form.Item>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                        <span style={fieldLabelStyle}>수량 *</span>
                        <Form.Item name="quantity" noStyle rules={[{ required: true, message: '수량을 입력해주세요' }]}>
                            <Input
                                type="number"
                                style={{ ...inputStyle, textAlign: 'right', fontFamily: 'var(--mono)' }}
                                suffix={<span style={{ color: 'var(--t4)', fontSize: 13, fontFamily: 'Pretendard Variable' }}>주</span>}
                            />
                        </Form.Item>
                    </div>
                    <div>
                        <span style={fieldLabelStyle}>평균단가 *</span>
                        <Form.Item name="avgPurchasePrice" noStyle rules={[{ required: true, message: '평균단가를 입력해주세요' }]}>
                            <Input
                                type="number"
                                style={{ ...inputStyle, textAlign: 'right', fontFamily: 'var(--mono)' }}
                                suffix={<span style={{ color: 'var(--t4)', fontSize: 13, fontFamily: 'Pretendard Variable' }}>{unitLabel(currency)}</span>}
                            />
                        </Form.Item>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <span style={fieldLabelStyle}>증권사</span>
                        <Form.Item name="brokerage" noStyle>
                            <Input style={inputStyle} placeholder="예: 미래에셋증권" />
                        </Form.Item>
                    </div>
                </div>
            </Form>

            <div data-sf="modalfooter" style={{ padding: '16px 26px', borderTop: '1px solid var(--bd2)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--t4)' }}>* 표시 항목은 필수입니다</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 9, flex: 'none' }}>
                    <div
                        onClick={closeAssetModal}
                        className="sf-btn"
                        style={{ height: 42, padding: '0 18px', display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}
                    >
                        취소
                    </div>
                    <div
                        onClick={() => form.submit()}
                        style={{ height: 42, padding: '0 22px', display: 'flex', alignItems: 'center', borderRadius: 10, background: 'var(--nav)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.88; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
                    >
                        {isEditing ? '수정하기' : '등록하기'}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default AssetModal;
