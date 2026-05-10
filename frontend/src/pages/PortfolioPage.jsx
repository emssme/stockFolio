import { useEffect, useState } from 'react';
import { Table } from 'antd';
import { getPortfolio } from '../api/portfolioApi';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';


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


    const columns = [
        { title: '자산명', dataIndex: 'name' },
        { title: '티커', dataIndex: 'ticker' },
        { title: '수량', dataIndex: 'quantity' },
        { title: '평균단가', dataIndex: 'avgPurchasePrice' },
        { title: '현재가', dataIndex: 'currentPrice' },
        { title: '평가금액', dataIndex: 'currentValue' },
        { title: '수익률', dataIndex: 'profitRate' },
    ];

    const pieData = data.map(a => ({ name: a.name, value: Number(a.currentValue) }));
    const barData = data.map(a => ({ name: a.name, 수익률: Number(a.profitRate) }));
    const getColor = (index, total) => `hsl(${(index * 360) / total}, 65%, 55%)`;

    return (
        <>
            <Table dataSource={data} columns={columns} rowKey="ticker" />
            {/* PieChart */}
            <div width={400} style={{ display: 'grid', justifyContent: 'center', marginTop: '50px' }}>
                <h3 style={{ marginBottom: '30px' }}>자산 비중</h3>
                <PieChart width={350} height={280}>
                    <Legend
                        height={110}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconSize={7}
                        wrapperStyle={{ paddingLeft: '20px' }}
                    />
                    <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={0}
                        outerRadius={80}
                        cx={80}
                        cy={100}
                    >
                        {pieData.map((_, index) => (
                            <Cell key={index} fill={getColor(index, pieData.length)} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </div>

            {/* BarChart */}
            <div width={400} style={{ display: 'grid', justifyContent: 'center', marginTop: '50px' }}>
                <h3 style={{ marginBottom: '30px' }}>수익률</h3>
                <BarChart width={400} height={280} data={barData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="수익률">
                        {barData.map((_, index) => (
                            <Cell key={index} fill={getColor(index, barData.length)} />
                        ))}
                    </Bar>
                </BarChart>
            </div>
        </>
    );
}

export default PortfolioPage;
