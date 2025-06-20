// src/components/Navbar.tsx (Lengkap & Sudah Diperbaiki)

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRoutes, UserRole } from '../constants';
import { PowerIcon, UserCircleIcon, BuildingLibraryIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(AppRoutes.LOGIN);
  };

  const navLinkClass = "px-3 py-2 rounded-md text-sm font-medium";
  const activeNavLinkClass = "bg-primary-dark text-white";
  const inactiveNavLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  // Cek apakah user adalah admin (baik 01 maupun 02) atau supervisor
  const isAdminOrSupervisor = user && (
    user.role === UserRole.ADMIN01 || 
    user.role === UserRole.ADMIN02 || 
    user.role === UserRole.SUPERVISOR
  );

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to={AppRoutes.DASHBOARD} className="flex-shrink-0 text-white font-semibold text-xl flex items-center">
              <BuildingLibraryIcon className="h-8 w-8 mr-2 text-primary-light" />
              InvSys
            </NavLink>
            {user && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <NavLink
                    to={AppRoutes.DASHBOARD}
                    className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : inactiveNavLinkClass}`}
                  >
                    Dashboard
                  </NavLink>
                  {isAdminOrSupervisor && (
                    <>
                      <NavLink
                        to={AppRoutes.OUTGOING_NEW}
                        className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : inactiveNavLinkClass}`}
                      >
                        New Borrowing
                      </NavLink>
                      <NavLink
                        to={AppRoutes.INCOMING_LIST}
                        className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : inactiveNavLinkClass}`}
                      >
                        Active Transactions
                      </NavLink>
                       <NavLink
                        to={AppRoutes.REPORTS}
                        className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : inactiveNavLinkClass}`}
                      >
                        Reports
                      </NavLink>
                    </>
                  )}
                  {user.role === UserRole.SUPERVISOR && (
                    <NavLink
                      to={AppRoutes.SUPERVISOR}
                      className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : inactiveNavLinkClass}`}
                    >
                      Supervisor Panel
                    </NavLink>
                  )}
                </div>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center">
              {user.companyLogo && user.role === UserRole.SUPERVISOR && (
                <img src={user.companyLogo} alt="Company Logo" className="h-8 w-auto mr-4 rounded"/>
              )}
              <UserCircleIcon className="h-8 w-8 text-gray-400 mr-2" />
              <span className="text-gray-300 mr-4 text-sm">{user.username} ({user.role})</span>
              
              {/* --- LINK BARU DI SINI --- */}
              <NavLink 
                to={AppRoutes.PROFILE} 
                className={`${navLinkClass} ${inactiveNavLinkClass} mr-2`} 
                title="Profile Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </NavLink>

              <button
                onClick={handleLogout}
                className={`${navLinkClass} ${inactiveNavLinkClass} flex items-center`}
                title="Logout"
              >
                <PowerIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
