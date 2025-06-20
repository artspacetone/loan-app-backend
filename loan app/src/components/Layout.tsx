import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 print:hidden">
        © {new Date().getFullYear()} Inventory Management System
      </footer>
    </div>
  );
};

export default Layout;
