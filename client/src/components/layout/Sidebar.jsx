import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ArrowRightLeft, Settings, LogOut, PackagePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager', 'staff'] },
        { name: 'Products', path: '/products', icon: <PackageSearch size={20} />, roles: ['admin', 'manager', 'staff'] },
        { name: 'Operations', path: '/operations', icon: <ArrowRightLeft size={20} />, roles: ['admin', 'manager', 'staff'] },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['admin'] }
    ];

    const visibleNavItems = navItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <aside className="glass-panel" style={{ width: '260px', height: 'calc(100vh - 32px)', margin: '16px 0 16px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                <h1 className="text-xl" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                    <PackagePlus size={24} />
                    CoreInventory
                </h1>
            </div>

            <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleNavItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            background: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                            fontWeight: isActive ? 600 : 500,
                            textDecoration: 'none',
                            transition: 'all var(--transition-fast)'
                        })}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)' }} onClick={logout}>
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
