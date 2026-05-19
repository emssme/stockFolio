import { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getPortfolio } from '../api/portfolioApi';
import { Client } from '@stomp/stompjs';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

function PortfolioPage() {
    const [data, setData] = useState([]);

    useEffect(() => {
        getPortfolio()
            .then(res => setData(res.data.assets))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws-native',
            onConnect: () => {
                data.forEach(asset => {
                    client.subscribe(`/topic/price/${asset.ticker}`, (msg) => {
                        const price = msg.body;
                        setData(prev => prev.map(a =>
                            a.ticker === asset.ticker ? { ...a, currentPrice: price } : a
                        ));
                    });
                });
            },
        });

        client.activate();
        return () => client.deactivate();
    }, [data.length]);

    const totalValue = data.reduce((sum, a) => sum + Number(a.currentValue || 0), 0);
    const totalCost = data.reduce((sum, a) => sum + Number(a.avgPurchasePrice || 0) * Number(a.quantity || 0), 0);
    const totalProfitRate = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0;

    const columns = [
        { title: '티커', dataIndex: 'ticker' },
        { title: '자산명', dataIndex: 'name' },
        { title: '수량', dataIndex: 'quantity', align: 'right' },
        { title: '평균단가', dataIndex: 'avgPurchasePrice', align: 'right', render: v => Number(v).toLocaleString() },
        { title: '현재가', dataIndex: 'currentPrice', align: 'right', render: v => Number(v).toLocaleString() },
        { title: '평가금액', dataIndex: 'currentValue', align: 'right', render: v => Number(v).toLocaleString() },
        {
            title: '수익률',
            dataIndex: 'profitRate',
            align: 'right',
            render: v => {
                const rate = Number(v);
                const color = rate >= 0 ? '#cf1322' : '#000d86';
                return <span style={{ color }}>{rate >= 0 ? '+' : ''}{rate}%</span>;
            }
        },
        { title: '증권사', dataIndex: 'brokerage', render: v => v || '-' },
        
    ];

    const pieData = data.map(a => ({ name: a.name, value: Number(a.currentValue) }));
    const barData = data.map(a => ({ name: a.name, 수익률: Number(a.profitRate) }));
    const getColor = (index, total) => `hsl(${(index * 360) / total}, 65%, 65%)`;

    return (
        <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="총 평가금액"
                            value={totalValue}
                            precision={0}
                            suffix="원"
                            styles={{ value: { color: '#1677ff' } }}
                            formatter={v => Number(v).toLocaleString()}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="총 수익률"
                            value={totalProfitRate}
                            precision={2}
                            suffix="%"
                            prefix={Number(totalProfitRate) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            styles={{ value: { color: Number(totalProfitRate) >= 0 ? '#cf1322' : '#3f8600' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="보유 종목 수"
                            value={data.length}
                            suffix="종목"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="자산 비중">
                        <ResponsiveContainer width="100%" height={260 + Math.ceil(pieData.length / 4) * 24}>
                            <PieChart>
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} formatter={v => <span style={{ color: '#000000' }}>{v}</span>} />
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="43%"
                                    innerRadius="40%"
                                    outerRadius="80%"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={index} fill={getColor(index, pieData.length)} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={v => Number(v).toLocaleString() + '원'} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="종목별 수익률">
                        <ResponsiveContainer width="100%" height={260 + Math.ceil(barData.length / 4) * 24}>
                            <BarChart data={barData}>
                                <XAxis dataKey="name" tick={false} height={0} />
                                <YAxis unit="%" />
                                <Tooltip formatter={v => v + '%'} />
                                <Legend
                                    verticalAlign="bottom"
                                    content={() => (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', paddingTop: 8 }}>
                                            {barData.map((item, index) => (
                                                <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: getColor(index, barData.length) }} />
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                />
                                <Bar dataKey="수익률">
                                    {barData.map((_, index) => (
                                        <Cell key={index} fill={getColor(index, barData.length)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
            
            <Card style={{ marginBottom: 24 }}>
                <Table dataSource={data} columns={columns} rowKey="ticker" pagination={false} scroll={{ x: 'max-content' }} />
            </Card>
        </>
    );
}

export default PortfolioPage;
