import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut,
} from './ui/command';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { SidebarTrigger } from './ui/sidebar';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Procurement Officer',
  supplier: 'Supplier',
};

const roleHome = (role) => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'supplier') return '/supplier';
  return '/dashboard';
};

const Navbar = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const rawUser = userJson ? JSON.parse(userJson) : null;
  const user = { name: 'Guest', role: 'supplier', email: '', ...rawUser };
  const [cmdOpen, setCmdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const isAdmin = user.role === 'admin';

  const allItems = [
    { label: 'Overview', desc: 'Dashboard', path: '/dashboard', shortcut: 'G O', adminOnly: false },
    { label: 'Open Tenders', desc: 'Tenders list', path: '/tenders', shortcut: 'G T', adminOnly: false },
    { label: 'Create Tender', desc: 'Admin only', path: '/create-tender', shortcut: '', adminOnly: true },
    { label: 'Leaderboard', desc: 'Rankings', path: '/rankings', shortcut: 'G R', adminOnly: true },
    { label: 'My Profile', desc: 'Supplier profile', path: '/profile', shortcut: '', adminOnly: false },
    { label: 'Public Home', desc: 'Public portal', path: '/', shortcut: '', adminOnly: false },
    { label: 'Contact', desc: 'Contact page', path: '/contact', shortcut: '', adminOnly: false },
    { label: 'Browse Tenders', desc: 'Public tender list', path: '/browse', shortcut: '', adminOnly: false },
  ];
  const items = allItems.filter(i => !i.adminOnly || isAdmin);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.name.split(' ')[0];
  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const goTo = (path) => { navigate(path); setCmdOpen(false); };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onMenuOpenChange = (v) => {
    setMenuOpen(v);
    if (!v) setConfirmLogout(false);
  };

  return (
    <>
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {items.map((item) => (
              <CommandItem key={item.path} value={`${item.label} ${item.desc}`} onSelect={() => goTo(item.path)}>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <header className="bg-card px-6 py-3.5 flex items-center justify-between shrink-0 gap-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger />
          <Link to={roleHome(user.role)} className="min-w-0 text-left transition-opacity hover:opacity-75 no-underline">
            <p className="text-base font-bold text-foreground whitespace-nowrap leading-tight">
              {greeting()}, {displayName}
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
              {ROLE_LABEL[user.role] || 'Portal'} · <span className="font-semibold text-primary">Dashboard</span>
            </p>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 w-44 justify-start text-muted-foreground font-normal"
          >
            <Search size={13} className="shrink-0" />
            <span className="flex-1 text-left text-xs">Search...</span>
            <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted border border-border font-mono shrink-0 text-muted-foreground">⌘K</kbd>
          </Button>

          <Button variant="outline" size="icon" className="relative text-muted-foreground">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
          </Button>

          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg border border-transparent transition-all hover:bg-accent hover:border-border">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                <Badge variant={user.role === 'super_admin' ? 'warning' : 'default'} className="mt-1.5">
                  {ROLE_LABEL[user.role]}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!confirmLogout ? (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                <div className="px-2 py-1.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Are you sure?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-1" onClick={handleLogout}>
                      Yes, Sign Out
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmLogout(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
};

export default Navbar;
