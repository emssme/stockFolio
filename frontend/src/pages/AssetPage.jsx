import { useEffect, useMemo, useState } from 'react';
import { Popconfirm, message } from 'antd';
import { getAssets, deleteAsset } from '../api/assetApi';
import { useUi } from '../context/UiContext';

const ASSET_TYPE_LABEL = { STOCK_KR: '국내주식', STOCK_US: '해외주식', CRYPTO: '코인' };
const FILTERS = ['전체', '국내주식', '해외주식', '코인'];
const PAGE_SIZE = 10;

const fmt = (v) => Number(v || 0).toLocaleString();
const monogram = (name) => (name || '').slice(0, 2).toUpperCase();

function AssetPage() {
    const { masked, openAssetModal, assetsVersion } = useUi();
    const [assets, setAssets] = useState([]);
    const [filter, setFilter] = useState('전체');
    const [page, setPage] = useState(1);

    const refreshAssets = () => getAssets().then((res) => setAssets(res.data)).catch((err) => console.error(err));

    useEffect(() => {
        refreshAssets();
    }, [assetsVersion]);

    const handleDelete = async (id) => {
        await deleteAsset(id);
        message.success('자산이 삭제되었습니다.');
        await refreshAssets();
    };

    const filtered = useMemo(() => {
        if (filter === '전체') return assets;
        return assets.filter((a) => ASSET_TYPE_LABEL[a.assetType] === filter);
    }, [assets, filter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const maskStyle = masked ? { filter: 'blur(7px)' } : undefined;

    const changeFilter = (f) => { setFilter(f); setPage(1); };

    return (
        <section style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '14px var(--pad)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--bd2)', flexWrap: 'wrap' }}>
                {FILTERS.map((f) => {
                    const on = f === filter;
                    return (
                        <div
                            key={f}
                            onClick={() => changeFilter(f)}
                            style={{ height: 32, padding: '0 13px', display: 'flex', alignItems: 'center', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--nav)' : 'transparent', color: on ? '#FFFFFF' : 'var(--t2)', border: `1px solid ${on ? 'var(--nav)' : 'var(--bd)'}`, transition: 'all .15s' }}
                        >
                            {f}
                        </div>
                    );
                })}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t4)' }}>총 {filtered.length}건</span>
                </div>
            </div>
            <div data-assets-view="table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--surf2)' }}>
                            <th style={{ textAlign: 'left', padding: '11px var(--pad)', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>자산명</th>
                            <th style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>종류</th>
                            <th style={{ textAlign: 'right', padding: '11px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>수량</th>
                            <th style={{ textAlign: 'right', padding: '11px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>평균단가</th>
                            <th style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>증권사</th>
                            <th style={{ textAlign: 'right', padding: '11px var(--pad)', fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 13 }}>등록된 자산이 없습니다.</td></tr>
                        ) : pageItems.map((a) => (
                            <tr key={a.id} className="sf-row" style={{ borderTop: '1px solid var(--bd2)', transition: 'background .12s' }}>
                                <td style={{ padding: '0 var(--pad)', height: 'var(--rowH)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bd2)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, flex: 'none' }}>
                                            {monogram(a.name)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</span>
                                            <span style={{ fontSize: 11.5, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{a.ticker}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '0 14px' }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--surf2)', border: '1px solid var(--bd2)', color: 'var(--t2)' }}>
                                        {ASSET_TYPE_LABEL[a.assetType] || a.assetType}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', padding: '0 14px', fontFamily: 'var(--mono)', fontSize: 'var(--num)' }}>{fmt(a.quantity)}</td>
                                <td style={{ textAlign: 'right', padding: '0 14px', fontFamily: 'var(--mono)', fontSize: 'var(--num)', ...maskStyle }}>{fmt(a.avgPurchasePrice)}</td>
                                <td style={{ padding: '0 14px', fontSize: 13, color: 'var(--t2)' }}>{a.brokerage || '-'}</td>
                                <td style={{ textAlign: 'right', padding: '0 var(--pad)' }}>
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <div onClick={() => openAssetModal(a)} className="sf-btn" style={{ height: 30, padding: '0 11px', display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}>
                                            수정
                                        </div>
                                        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(a.id)} okText="삭제" cancelText="취소">
                                            <div style={{ height: 30, padding: '0 11px', display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer' }}>
                                                삭제
                                            </div>
                                        </Popconfirm>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div data-assets-view="cards" style={{ display: 'none', flexDirection: 'column' }}>
                {pageItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 13 }}>등록된 자산이 없습니다.</div>
                ) : pageItems.map((a) => (
                    <div key={a.id} style={{ padding: '14px var(--pad)', borderTop: '1px solid var(--bd2)', display: 'flex', flexDirection: 'column', gap: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bd2)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flex: 'none' }}>
                                {monogram(a.name)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                                <span style={{ fontSize: 11.5, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{a.ticker}</span>
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--surf2)', border: '1px solid var(--bd2)', color: 'var(--t2)', flex: 'none' }}>
                                {ASSET_TYPE_LABEL[a.assetType] || a.assetType}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--t4)' }}>수량</span>
                                <span style={{ fontFamily: 'var(--mono)' }}>{fmt(a.quantity)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--t4)' }}>평균단가</span>
                                <span style={{ fontFamily: 'var(--mono)', ...maskStyle }}>{fmt(a.avgPurchasePrice)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}>
                                <span style={{ color: 'var(--t4)' }}>증권사</span>
                                <span>{a.brokerage || '-'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div onClick={() => openAssetModal(a)} className="sf-btn" style={{ flex: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}>
                                수정
                            </div>
                            <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(a.id)} okText="삭제" cancelText="취소">
                                <div style={{ flex: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer' }}>
                                    삭제
                                </div>
                            </Popconfirm>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length > 0 && (
                <div style={{ padding: '14px var(--pad)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bd2)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t4)' }}>
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}건
                    </span>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <div onClick={() => setPage((p) => Math.max(1, p - 1))} style={pagerBtnStyle(false)}>‹</div>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <div key={n} onClick={() => setPage(n)} style={pagerBtnStyle(n === page)}>{n}</div>
                        ))}
                        <div onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={pagerBtnStyle(false)}>›</div>
                    </div>
                </div>
            )}
        </section>
    );
}

function pagerBtnStyle(active) {
    return {
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${active ? 'var(--nav)' : 'var(--bd)'}`,
        background: active ? 'var(--nav)' : 'transparent',
        color: active ? '#fff' : 'var(--t4)',
        borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
    };
}

export default AssetPage;
