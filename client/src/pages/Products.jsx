import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Products = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', sku: '', category: '', unit_of_measure: 'Units', unit_cost: 0, initial_stock: 0, location_id: '' });

    const fetchProducts = () => {
        fetch('http://localhost:5000/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    };

    const fetchLocations = () => {
        fetch('http://localhost:5000/api/locations')
            .then(res => res.json())
            .then(data => setLocations(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchProducts();
        fetchLocations();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ name: '', sku: '', category: '', unit_of_measure: 'Units', unit_cost: 0, initial_stock: 0, location_id: '' });
                fetchProducts();
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Error creating product');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isStaff = user?.role === 'staff';

    return (
        <div className="animate-fade-in flex-col gap-4" style={{ height: '100%' }}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl">Products Master</h1>
                    <p className="text-muted">Manage all product variants and categories.</p>
                </div>
                {!isStaff && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> New Product
                    </button>
                )}
            </div>

            <div className="card flex items-center gap-2 mb-4" style={{ padding: '12px' }}>
                <Search size={20} className="text-muted" />
                <input type="text" style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', outline: 'none', width: '100%' }} />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            <th style={{ padding: '12px 24px' }}>SKU</th>
                            <th style={{ padding: '12px 24px' }}>Name</th>
                            <th style={{ padding: '12px 24px' }}>Location</th>
                            <th style={{ padding: '12px 24px' }}>Initial Qty</th>
                            <th style={{ padding: '12px 24px' }}>+ In (Receipts)</th>
                            <th style={{ padding: '12px 24px' }}>- Out (Deliveries)</th>
                            <th style={{ padding: '12px 24px' }}>Available Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 24px' }}>{p.sku}</td>
                                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{p.name}</td>
                                <td style={{ padding: '16px 24px' }}>{p.location_name ? `${p.warehouse_name} - ${p.location_name}` : 'Unassigned'}</td>
                                <td style={{ padding: '16px 24px' }}>{Number(p.initial_stock || 0)}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-success)' }}>+{Number(p.total_receipts || 0)}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-warning)' }}>-{Number(p.total_deliveries || 0)}</td>
                                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-primary)' }}>{Number(p.available_stock || 0)}</td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No products found. Create one above!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-panel animate-slide-up" style={{ width: '500px', padding: '32px' }}>
                        <h2 className="text-xl mb-4">Create Product</h2>
                        <form onSubmit={handleCreate} className="flex-col gap-4">
                            <div className="input-group">
                                <label>Name</label>
                                <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label>SKU</label>
                                    <input required className="input-field" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Category</label>
                                    <input className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Warehouse / Location</label>
                                <select required className="input-field" value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })}>
                                    <option value="">Select a location...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.warehouse_name} - {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label>Purchase Cost (₹)</label>
                                    <input type="number" min="0" step="0.01" className="input-field" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })} />
                                </div>
                                <div className="input-group">
                                    <label>Initial Stock Qty</label>
                                    <input type="number" min="0" className="input-field" value={formData.initial_stock} onChange={e => setFormData({ ...formData, initial_stock: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex justify-between mt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
