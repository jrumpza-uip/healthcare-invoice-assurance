import { Button } from '@uipath/apollo-wind/components/ui/button';
import { FileSearch, FolderSearch, LayoutDashboard, LogOut, Menu, PlusCircle, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './Theme';

const navigation = [
  { to: '/', label: 'Portfolio', icon: LayoutDashboard, end: true },
  { to: '/new', label: 'New analysis', icon: PlusCircle },
  { to: '/contracts', label: 'Contract library', icon: FolderSearch },
];

export function AppShell({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-lockup"><span className="brand-symbol"><ShieldCheck className="h-5 w-5" /></span><span><strong>Healthcare Invoice Assurance</strong><small>UiPath governed review</small></span></div>
      <div className="topbar-actions"><span className="environment-pill">Playground · HLS</span><ThemeToggle /><Button variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /><span className="hide-mobile">Sign out</span></Button><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button></div>
    </header>
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-context"><span>Workspace</span><strong>AMER Presales / HLS</strong></div>
      <nav aria-label="Primary navigation">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'nav-item nav-active' : 'nav-item'}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
      <div className="sidebar-footer"><FileSearch className="h-5 w-5" /><div><strong>Evidence first</strong><span>Contract citations and immutable source lineage</span></div></div>
    </aside>
    <main className="app-content">{children}</main>
  </div>;
}
