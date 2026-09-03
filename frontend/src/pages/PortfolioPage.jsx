import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { getPortfolio } from '../api/portfolioApi';
import { useUi } from '../context/UiContext';

const ASSET_TYPE_LABEL = { STOCK_KR: '국내주식', STOCK_US: '해외주식', CRYPTO: '코인' };
const PALETTE = ['#E5484D', '#2D6BFF', '#F5A623', '#12A150', '#8B5CF6', '#0EA5E9'];
const PERIODS = ['1D', '1W', '1M', '3M', '1Y'];

const fmt = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const monogram = (name) => (name || '').slice(0, 2).toUpperCase();

function withComputedFields(asset) {
    const currentValue = Number(asset.currentPrice) * Number(asset.quantity);
    const purchaseAmount = Number(asset.avgPurchasePrice) * Number(asset.quantity);
    const profit = currentValue - purchaseAmount;
    const profitRate = purchaseAmount > 0 ? (profit / purchaseAmount) * 100 : 0;
    return { ...asset, currentValue, purchaseAmount, profit, profitRate };
}

function PortfolioPage() {
    const navigate = useNavigate();
    const { masked } = useUi();
    const [period, setPeriod] = useState('3M');
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        getPortfolio()
            .then((res) => setAssets(res.data.assets || []))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (assets.length === 0) return;
        const client = new Client({
            brokerURL: import.meta.env.VITE_WS_URL,
            onConnect: () => {
                assets.forEach((asset) => {
                    client.subscribe(`/topic/price/${asset.ticker}`, (msg) => {
                        const price = Number(msg.body);
                        setAssets((prev) => prev.map((a) => (a.ticker === asset.ticker ? { ...a, currentPrice: price } : a)));
                    });
                });
            },
        });
        client.activate();
        return () => client.deactivate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assets.length]);

    const computed = useMemo(() => assets.map(withComputedFields), [assets]);
    const totalValue = computed.reduce((sum, a) => sum + a.currentValue, 0);
    const totalCost = computed.reduce((sum, a) => sum + a.purchaseAmount, 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const isUp = totalProfit >= 0;

    const todayChange = computed.reduce((sum, a) => {
        const rate = Number(a.priceChangeRate || 0);
        const prevValue = a.currentValue / (1 + rate / 100);
        return sum + (a.currentValue - prevValue);
    }, 0);
    const todayBase = totalValue - todayChange;
    const todayChangeRate = todayBase > 0 ? (todayChange / todayBase) * 100 : 0;

    const withShare = computed
        .map((a) => ({ ...a, share: totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0 }))
        .sort((a, b) => b.currentValue - a.currentValue);

    const gradientStops = withShare.reduce((state, a, i) => {
        const start = state.acc;
        const end = start + a.share;
        state.stops.push(`${PALETTE[i % PALETTE.length]} ${start}% ${end}%`);
        state.acc = end;
        return state;
    }, { acc: 0, stops: [] }).stops;
    const topShare = withShare[0]?.share || 0;
    const insight = withShare.length === 0
        ? '등록된 자산이 없습니다.'
        : topShare >= 50
            ? `${withShare[0].name} 비중이 높습니다. 분산을 검토해 보세요.`
            : '자산이 고르게 분산되어 있습니다.';

    const maskStyle = masked ? { filter: 'blur(7px)' } : undefined;

    const chartPoints = buildTrendPoints(totalCost, totalValue);
    const chartDates = last5Dates();

    return (
        <>
            <div data-sf="grid2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap)' }}>
                <section style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--pad) var(--pad) 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t3)' }}>총 평가금액</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.05, ...maskStyle }}>{fmt(totalValue)}</span>
                                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--t3)' }}>원</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                                <span style={{ padding: '3px 9px', borderRadius: 7, background: isUp ? 'var(--upBg)' : 'var(--dnBg)', color: isUp ? 'var(--up)' : 'var(--dn)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)' }}>
                                    {isUp ? '▲' : '▼'} {fmt(Math.abs(totalProfitRate))}%
                                </span>
                                <span style={{ fontSize: 13, color: isUp ? 'var(--up)' : 'var(--dn)', fontFamily: 'var(--mono)', fontWeight: 500, ...maskStyle }}>
                                    {isUp ? '+' : ''}{fmt(totalProfit)}원
                                </span>
                                <span style={{ fontSize: 12.5, color: 'var(--t4)' }}>· 원금 {fmt(totalCost)}원</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--surf2)', border: '1px solid var(--bd2)', borderRadius: 9 }}>
                            {PERIODS.map((p) => {
                                const on = p === period;
                                return (
                                    <div key={p} onClick={() => setPeriod(p)} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: on ? 'var(--surf)' : 'transparent', color: on ? 'var(--t1)' : 'var(--t3)', boxShadow: on ? 'var(--shadow)' : 'none', transition: 'all .15s' }}>
                                        {p}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ padding: '4px 0 0', position: 'relative' }}>
                        <svg viewBox="0 0 640 180" preserveAspectRatio="none" style={{ width: '100%', height: 180, display: 'block' }}>
                            <polyline points={`0,178 ${chartPoints} 640,178`} fill={isUp ? 'var(--upBg)' : 'var(--dnBg)'} stroke="none" />
                            <polyline points={chartPoints} fill="none" stroke={isUp ? 'var(--up)' : 'var(--dn)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px var(--pad) var(--pad)', fontSize: 11.5, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>
                            {chartDates.map((d) => <span key={d}>{d}</span>)}
                        </div>
                    </div>
                </section>

                <div data-sf="kpis" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
                    <div style={{ gridColumn: 'span 2', background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>자산 비중</span>
                            <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{withShare[0] ? `${ASSET_TYPE_LABEL[withShare[0].assetType] || ''} 최다` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 106, height: 106, borderRadius: '50%', flex: 'none', background: gradientStops.length ? `conic-gradient(${gradientStops.join(', ')})` : 'var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'var(--surf)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)' }}>{withShare.length}</span>
                                    <span style={{ fontSize: 10, color: 'var(--t4)' }}>종목</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                                {withShare.slice(0, 3).map((a, i) => (
                                    <div key={a.assetId} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 3, background: PALETTE[i % PALETTE.length], flex: 'none' }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                                        <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--t2)' }}>{fmt(a.share)}%</span>
                                    </div>
                                ))}
                                <div style={{ height: 1, background: 'var(--bd2)' }} />
                                <div style={{ fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.5 }}>{insight}</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t3)' }}>오늘 손익</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 600, color: todayChange >= 0 ? 'var(--up)' : 'var(--dn)', ...maskStyle }}>
                            {todayChange >= 0 ? '+' : ''}{fmt(todayChange)}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{fmt(todayChangeRate)}% · 전일 대비</span>
                    </div>
                    <div style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t3)' }}>총 손익</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 600, color: isUp ? 'var(--up)' : 'var(--dn)', ...maskStyle }}>
                            {isUp ? '+' : ''}{fmt(totalProfit)}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>원금 대비 {fmt(totalProfitRate)}%</span>
                    </div>
                </div>
            </div>

            <section style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 'var(--rad)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px var(--pad)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--bd2)' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>보유 종목</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t4)', background: 'var(--surf2)', border: '1px solid var(--bd2)', padding: '2px 7px', borderRadius: 6 }}>{computed.length}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <div onClick={() => navigate('/assets')} className="sf-btn" style={{ height: 30, padding: '0 11px', display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer' }}>
                            전체 보기
                        </div>
                    </div>
                </div>
                <div data-sf="wide">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                        <thead>
                            <tr style={{ background: 'var(--surf2)' }}>
                                <th style={thStyle('left', 'var(--pad)')}>종목</th>
                                <th style={thStyle('right')}>수량</th>
                                <th style={thStyle('right')}>평균단가</th>
                                <th style={thStyle('right')}>현재가</th>
                                <th style={thStyle('right')}>평가금액</th>
                                <th style={thStyle('right')}>평가손익</th>
                                <th style={thStyle('right', undefined, 'var(--pad)')}>비중</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withShare.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t4)', fontSize: 13 }}>등록된 자산이 없습니다.</td></tr>
                            ) : withShare.map((a) => {
                                const up = a.profit >= 0;
                                return (
                                    <tr key={a.assetId} className="sf-row" style={{ borderTop: '1px solid var(--bd2)', transition: 'background .12s' }}>
                                        <td style={{ padding: '0 var(--pad)', height: 'var(--rowH)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 9, background: up ? 'var(--upBg)' : 'var(--dnBg)', color: up ? 'var(--up)' : 'var(--dn)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flex: 'none' }}>
                                                    {monogram(a.name)}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</span>
                                                    <span style={{ fontSize: 11.5, color: 'var(--t4)', fontFamily: 'var(--mono)' }}>{a.ticker}{a.brokerage ? ` · ${a.brokerage}` : ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{fmt(a.quantity)}</td>
                                        <td style={{ ...tdStyle, color: 'var(--t2)' }}>{fmt(a.avgPurchasePrice)}</td>
                                        <td style={{ ...tdStyle, fontWeight: 500 }}>{fmt(a.currentPrice)}</td>
                                        <td style={{ ...tdStyle, fontWeight: 600, ...maskStyle }}>{fmt(a.currentValue)}</td>
                                        <td style={{ textAlign: 'right', padding: '0 14px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--num)', fontWeight: 600, color: up ? 'var(--up)' : 'var(--dn)', ...maskStyle }}>
                                                    {up ? '+' : ''}{fmt(a.profit)}
                                                </span>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: up ? 'var(--up)' : 'var(--dn)' }}>{up ? '+' : ''}{fmt(a.profitRate)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '0 var(--pad)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                                <div style={{ width: 52, height: 5, borderRadius: 3, background: 'var(--bd2)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${a.share}%`, height: '100%', background: up ? 'var(--up)' : 'var(--dn)' }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--t3)', width: 38 }}>{fmt(a.share)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

function thStyle(align, padLeft, padRight) {
    return { textAlign: align, padding: `11px ${padRight || (align === 'left' ? '14px' : '14px')}`, paddingLeft: padLeft, fontSize: 11.5, fontWeight: 600, color: 'var(--t3)' };
}
const tdStyle = { textAlign: 'right', padding: '0 14px', fontFamily: 'var(--mono)', fontSize: 'var(--num)' };

function buildTrendPoints(start, end) {
    const y = (v, min, max) => {
        if (max === min) return 90;
        return 178 - ((v - min) / (max - min)) * 150;
    };
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const mid1 = start + (end - start) * 0.35;
    const mid2 = start + (end - start) * 0.7;
    const pts = [
        [0, y(start, min, max)],
        [210, y(mid1, min, max)],
        [430, y(mid2, min, max)],
        [640, y(end, min, max)],
    ];
    return pts.map(([x, py]) => `${x},${Math.round(py)}`).join(' ');
}

function last5Dates() {
    const out = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        out.push(`${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`);
    }
    return out;
}

export default PortfolioPage;
