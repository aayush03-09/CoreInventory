import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Operations = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [operations, setOperations] = useState([]);
    const [products, setProducts] = useState([]);

    // Modal State
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('receipt');
    const [formData, setFormData] = useState({ contact: '', productId: '', quantity: 1, price: 0, scheduled_date: new Date().toISOString().split('T')[0] });

    const fetchOperations = () => {
        fetch('http://localhost:5000/api/operations')
            .then(res => res.json())
            .then(data => setOperations(data))
            .catch(console.error);
    };

    const fetchProducts = () => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchOperations();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (location.state?.openModal && user?.role !== 'staff') {
            setFormType(location.state.openModal);
            setShowForm(true);
            // Optional: clear state so refresh doesn't pop it open again
            window.history.replaceState({}, document.title);
        }
    }, [location.state, user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                operation_type: formType,
                contact: formData.contact,
                source_location_id: formType === 'receipt' ? null : 1, // simplified assumption
                dest_location_id: formType === 'receipt' ? 1 : null,
                scheduled_date: formData.scheduled_date,
                products: [{ product_id: formData.productId, quantity: formData.quantity, price: formData.price }]
            };

            const res = await fetch('http://localhost:5000/api/operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({ contact: '', productId: '', quantity: 1, price: 0, scheduled_date: new Date().toISOString().split('T')[0] });
                fetchOperations(); // Reload db table real-time update
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Error creating operation');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        const classes = { 'draft': 'badge badge-draft', 'waiting': 'badge badge-waiting', 'ready': 'badge badge-ready', 'done': 'badge badge-done', 'canceled': 'badge badge-canceled' };
        return <span className={classes[status.toLowerCase()] || 'badge'}>{status.toUpperCase()}</span>;
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'receipt': return 'var(--color-success)';
            case 'delivery': return 'var(--color-warning)';
            case 'transfer': return 'var(--color-secondary)';
            default: return 'var(--color-text-muted)';
        }
    };

    const isStaff = user?.role === 'staff';

    return (
        <div className="animate-fade-in flex-col gap-4" style={{ height: '100%' }}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl">Operations Overview</h1>
                    <p className="text-muted">Manage all receipts, deliveries, and internal transfers.</p>
                </div>
                {!isStaff && (
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={() => { setFormType('receipt'); setShowForm(true); }}><Plus size={18} /> Receipt</button>
                        <button className="btn btn-secondary" onClick={() => { setFormType('delivery'); setShowForm(true); }}><Plus size={18} /> Delivery</button>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            <th style={{ padding: '12px 24px' }}>Reference</th>
                            <th style={{ padding: '12px 24px' }}>Contact</th>
                            <th style={{ padding: '12px 24px' }}>Qty</th>
                            <th style={{ padding: '12px 24px' }}>Date Scheduled</th>
                            <th style={{ padding: '12px 24px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operations.map(op => (
                            <tr key={op.id} style={{ borderTop: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-black/5">
                                <td style={{ padding: '16px 24px', fontWeight: 600, color: getTypeColor(op.operation_type) }}>{op.reference}</td>
                                <td style={{ padding: '16px 24px' }}>{op.contact || '-'}</td>
                                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{op.total_quantity || 0}</td>
                                <td style={{ padding: '16px 24px' }}>{new Date(op.scheduled_date || op.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '16px 24px' }}>{getStatusBadge(op.status)}</td>
                            </tr>
                        ))}
                        {operations.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No operations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel animate-slide-up" style={{ width: '500px', padding: '32px' }}>
                        <h2 className="text-xl mb-4">New {formType === 'receipt' ? 'Receipt' : 'Delivery'}</h2>
                        <form onSubmit={handleCreate} className="flex-col gap-4">
                            <div className="input-group">
                                <label>{formType === 'receipt' ? 'Vendor Contact' : 'Customer Contact'}</label>
                                <input required className="input-field" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Date Scheduled</label>
                                <input required type="date" className="input-field" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label>Product</label>
                                    <select required className="input-field" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })}>
                                        <option value="">Select Item...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Quantity</label>
                                    <input required type="number" min="1" className="input-field" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="input-group">
                                    <label>{formType === 'delivery' ? 'Selling Price' : 'Purchase Price'} (₹)</label>
                                    <input type="number" min="0" step="0.01" className="input-field" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                            </div>
                            <div className="flex justify-between mt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Process {formType === 'receipt' ? 'Receipt' : 'Delivery'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;
