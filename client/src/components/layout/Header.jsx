import React from 'react';
import { User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="glass-panel" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', margin: '16px 16px 0 16px', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex items-center gap-4">
                <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
                    <Bell size={18} />
                </button>
                <div className="flex items-center gap-2" style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '16px' }}>
                    <div style={{ background: 'var(--color-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="white" />
                    </div>
                    <div>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{user?.name || 'Administrator'}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role || 'Admin'}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
