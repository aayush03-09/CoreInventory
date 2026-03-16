import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
    return (
        <div className="flex" style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <div className="flex-col" style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
