import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertCircle, ArrowDownToLine, ArrowUpToLine, History, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [kpis, setKpis] = useState({
        totalProducts: 0, lowStock: 0, outOfStock: 0, profit: 0, pendingReceipts: 0, pendingDeliveries: 0
    });

    const [operations, setOperations] = useState([]);

    const fetchDashboardData = () => {
        const timestamp = Date.now();
        fetch(`http://localhost:5000/api/dashboard/kpis?t=${timestamp}`)
            .then(res => res.json())
            .then(data => setKpis(data))
            .catch(console.error);

        fetch(`http://localhost:5000/api/operations?t=${timestamp}`)
            .then(res => res.json())
            .then(data => setOperations(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const markAsDone = async (id) => {
        if (!window.confirm('Mark this operation as completed?')) return;
        try {
            console.log(`Sending PUT request to: http://localhost:5000/api/operations/${id}/status`);
            const res = await fetch(`http://localhost:5000/api/operations/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' })
            });
            if (res.ok) {
                fetchDashboardData();
            } else {
                const errData = await res.json();
                console.error('Failed to mark as done:', errData);
                alert(`Error: ${errData.message || 'Failed to update status'}`);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert(`Network error: ${err.message}`);
        }
    };

    const isStaff = user?.role === 'staff';

    let statCards = [];
    
    // Profit Formatting
    const profitValue = kpis.profit || 0;
    const isLoss = profitValue < 0;
    const absProfit = Math.abs(profitValue);
    const profitStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(absProfit);
    const finalProfitLabel = isLoss ? `-${profitStr}` : profitStr;
    const profitColor = isLoss ? 'var(--color-danger)' : 'var(--color-success)';

    if (!isStaff) {
        statCards = [
            { title: 'Total Profit', value: finalProfitLabel, icon: <History size={24} />, color: profitColor },
            { title: 'Total Products', value: kpis.totalProducts, icon: <Package size={24} />, color: 'var(--color-primary)' },
            { title: 'Low / Out of Stock', value: `${kpis.lowStock} / ${kpis.outOfStock}`, icon: <AlertCircle size={24} />, color: 'var(--color-danger)' },
            { title: 'Pending Receipts', value: kpis.pendingReceipts, icon: <ArrowDownToLine size={24} />, color: 'var(--color-info)' },
            { title: 'Pending Deliveries', value: kpis.pendingDeliveries, icon: <ArrowUpToLine size={24} />, color: 'var(--color-warning)' },
        ];
    } else {
        statCards = [
            { title: 'Pending Receipts', value: kpis.pendingReceipts, icon: <ArrowDownToLine size={24} />, color: 'var(--color-info)' },
            { title: 'Pending Deliveries', value: kpis.pendingDeliveries, icon: <ArrowUpToLine size={24} />, color: 'var(--color-warning)' },
        ];
    }

    const pendingOps = operations.filter(o => o.status !== 'done' && o.status !== 'canceled');
    const completedOps = operations.filter(o => o.status === 'done');

    // Group completed operations by date for the chart
    const chartData = useMemo(() => {
        const dataMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dataMap[dateStr] = { name: dateStr, receipts: 0, deliveries: 0 };
        }

        completedOps.forEach(op => {
            const dateStr = new Date(op.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (dataMap[dateStr]) {
                if (op.operation_type === 'receipt') {
                    dataMap[dateStr].receipts += parseFloat(op.total_quantity || 0);
                } else if (op.operation_type === 'delivery') {
                    dataMap[dateStr].deliveries += parseFloat(op.total_quantity || 0);
                }
            }
        });
        return Object.values(dataMap);
    }, [completedOps]);

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <h1 className="text-2xl">Welcome, {user?.name || 'User'}</h1>
                <p className="text-muted">Here's what's happening in your warehouses today.</p>
            </div>

            <div className="grid gap-4 mb-4 mt-4" style={{ gridTemplateColumns: `repeat(${statCards.length}, minmax(0, 1fr))` }}>
                {statCards.map((stat, i) => (
                    <div key={i} className="card flex items-center gap-4">
                        <div style={{ padding: '16px', borderRadius: '12px', background: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{stat.title}</p>
                            <p className="text-2xl">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card mb-4" style={{ padding: '24px' }}>
                <h2 className="text-xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} /> Inventory Volume Trends (Last 7 Days)
                </h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--glass-shadow)', background: 'var(--color-bg-card)' }} />
                            <Area type="monotone" dataKey="receipts" name="Receipts (In Qty)" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorReceipt)" />
                            <Area type="monotone" dataKey="deliveries" name="Deliveries (Out Qty)" stroke="var(--color-warning)" fillOpacity={1} fill="url(#colorDelivery)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                        <h2 className="text-xl" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={20} /> Pending Deliveries / Receipts
                        </h2>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {pendingOps.slice(0, 5).map(op => (
                            <li key={op.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>{op.reference}</p>
                                    <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{op.operation_type.toUpperCase()} • Qty: {op.total_quantity || 0}</p>
                                </div>
                                {isStaff && (
                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }} onClick={() => markAsDone(op.id)}>Mark Done</button>
                                )}
                            </li>
                        ))}
                        {pendingOps.length === 0 && <li style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No pending operations.</li>}
                    </ul>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                        <h2 className="text-xl" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History size={20} /> Recent Operations
                        </h2>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {completedOps.slice(0, 5).map(op => (
                            <li key={op.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>{op.reference}</p>
                                    <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                                        {op.operation_type.toUpperCase()} • Completed {new Date(op.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="badge badge-done">DONE</span>
                            </li>
                        ))}
                        {completedOps.length === 0 && <li style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No completed operations yet.</li>}
                    </ul>
                </div>

                {!isStaff && (
                    <div className="card">
                        <h2 className="text-xl mb-4">Quick Actions</h2>
                        <div className="flex-col gap-2">
                            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/operations', { state: { openModal: 'receipt' } })}>+ New Receipt</button>
                            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/operations', { state: { openModal: 'delivery' } })}>+ New Delivery</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
