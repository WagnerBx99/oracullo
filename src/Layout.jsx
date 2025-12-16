import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Database, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Layers,
  Users,
  Menu,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const menuItems = [
    { 
      label: 'Visão Geral', 
      icon: LayoutDashboard, 
      page: 'Dashboard',
      submenu: [
        { label: 'Consolidado', page: 'Dashboard' },
        { label: 'Diretoria', page: 'Diretoria' },
        { label: 'Comercial', page: 'Comercial' },
        { label: 'Operacional', page: 'Operacional' }
      ]
    },
    { 
      label: 'Gestão de Preços', 
      icon: Database, 
      page: 'GestaoPrecos',
      submenu: [
        { label: 'Custo x Venda', page: 'GestaoPrecos' },
        { label: 'Ajuste de Margem', page: 'Manipulaveis' }
      ]
    },
    { 
      label: 'Integrações', 
      icon: Database, 
      page: 'Integracoes',
      submenu: [
        { label: 'ERP (OMIE/WK)', page: 'Integracoes' },
        { label: 'CRM (Mercos/Clic)', page: 'Integracoes' },
        { label: 'Input Manual', page: 'Formularios' }
      ]
    },
    { 
      label: 'Relatórios', 
      icon: FileText, 
      page: 'Relatorios'
    },
    { 
      label: 'Administração', 
      icon: Settings, 
      page: 'Configuracoes',
      submenu: [
        { label: 'Usuários', page: 'Configuracoes' },
        { label: 'Log de Atividades', page: 'LogAtividades' }
      ]
    }
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  const NavContent = () => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-xl font-bold text-white">ORÁCULO</h1>
              <p className="text-xs text-slate-400">Sistema de Gestão</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentPageName === item.page || 
            item.submenu?.some(sub => currentPageName === sub.page);
          
          return (
            <div key={item.page}>
              <Link to={createPageUrl(item.page)}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }
                `}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
              </Link>
              
              {!collapsed && item.submenu && isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="ml-8 mt-2 space-y-1"
                >
                  {item.submenu.map((sub) => (
                    <Link key={sub.page} to={createPageUrl(sub.page)}>
                      <div className={`
                        px-4 py-2 rounded-lg text-sm transition-colors
                        ${currentPageName === sub.page 
                          ? 'text-blue-400 bg-blue-600/10' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                        }
                      `}>
                        {sub.label}
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="w-10 h-10 border-2 border-slate-600">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
              {user?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Desktop Only */}
      <div className="p-4 hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 z-40 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <Layers className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold">ORÁCULO</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-800 z-50"
          >
            <NavContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`
          hidden lg:block fixed left-0 top-0 bottom-0 bg-slate-800 z-30 transition-all duration-300
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        <NavContent />
      </aside>

      {/* Main Content */}
      <main 
        className={`
          transition-all duration-300 min-h-screen
          pt-16 lg:pt-0
          ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}
        `}
      >
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}