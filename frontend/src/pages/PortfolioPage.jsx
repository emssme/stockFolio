import { useEffect, useState } from 'react';
import { Table } from 'antd';
import { getPortfolio } from '../api/portfolioApi';

function PortfolioPage() {
    const [data, setData] = useState([]);

    useEffect(() => {
        getPortfolio()
            .then(res => setData(res.data.assets))
            .catch(err => console.error(err));
    }, []);

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
