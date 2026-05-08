import { useEffect, useState } from 'react';
import { Table } from 'antd';
import { getPortfolio } from '../api/portfolioApi';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';


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

    return <Table dataSource={data} columns={columns} rowKey="ticker" />;
}

export default PortfolioPage;
