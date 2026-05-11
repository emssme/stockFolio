import { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getPortfolio } from '../api/portfolioApi';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
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

        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            data.forEach(asset => {
                client.subscribe(`/topic/price/${asset.ticker}`, (msg) => {
                    const price = msg.body;
                    setData(prev => prev.map(a =>
                        a.ticker === asset.ticker ? { ...a, currentPrice: price } : a
                    ));
                });
            });
        });

        return () => client.disconnect();
    }, [data.length]);

    const totalValue = data.reduce((sum, a) => sum + Number(a.currentValue || 0), 0);
    const totalCost = data.reduce((sum, a) => sum + Number(a.avgPurchasePrice || 0) * Number(a.quantity || 0), 0);
    const totalProfitRate = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0;

    const columns = [
        { title: '자산명', dataIndex: 'name' },
        { title: '티커', dataIndex: 'ticker' },
        { title: '수량', dataIndex: 'quantity' },
        { title: '평균단가', dataIndex: 'avgPurchasePrice', render: v => Number(v).toLocaleString() },
        { title: '현재가', dataIndex: 'currentPrice', render: v => Number(v).toLocaleString() },
        { title: '평가금액', dataIndex: 'currentValue', render: v => Number(v).toLocaleString() },
        {
            title: '전일대비',
            dataIndex: 'priceChangeRate',
            render: v => {
                const rate = Number(v);
                const color = rate >= 0 ? '#cf1322' : '#3f8600';
                return <span style={{ color }}>{rate >= 0 ? '+' : ''}{rate.toFixed(2)}%</span>;
            }
        },
        {
            title: '수익률',
            dataIndex: 'profitRate',
            render: v => {
                const rate = Number(v);
                const color = rate >= 0 ? '#cf1322' : '#3f8600';
                return <span style={{ color }}>{rate >= 0 ? '+' : ''}{rate}%</span>;
            }
        },
        { title: '증권사', dataIndex: 'brokerage', render: v => v || '-' },
        
    ];

    const pieData = data.map(a => ({ name: a.name, value: Number(a.currentValue) }));
    const barData = data.map(a => ({ name: a.name, 수익률: Number(a.profitRate) }));
    const getColor = (index, total) => `hsl(${(index * 360) / total}, 65%, 55%)`;

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

            <Card style={{ marginBottom: 24 }}>
                <Table dataSource={data} columns={columns} rowKey="ticker" pagination={false} scroll={{ x: 'max-content' }} />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="자산 비중">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={10} wrapperStyle={{ paddingLeft: '20px' }} />
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={70}
                                    outerRadius={100}
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
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData}>
                                <XAxis dataKey="name" />
                                <YAxis unit="%" />
                                <Tooltip formatter={v => v + '%'} />
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
        </>
    );
}

export default PortfolioPage;
