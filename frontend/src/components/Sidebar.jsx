import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ListCollapse, Trophy, LogOut,
  ShieldCheck, User as UserIcon, Building2, Home,
  ClipboardCheck, Users, BarChart2, MessageSquare,
} from 'lucide-react';
import { apiService } from '../services/api';
import { LogoMark } from './Logo';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import {
  Sidebar as SidebarRoot, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  sidebarMenuButtonClass, SidebarLabel,
} from './ui/sidebar';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const rawUser = userJson ? JSON.parse(userJson) : null;
  const user = { name: 'Guest', role: 'supplier', email: '', ...rawUser };
  const role = user.role;
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (role !== 'super_admin') return;
    apiService.getMessages()
      .then(res => setUnreadMessages(res.data.unread || 0))
      .catch(() => {});
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = ({ isActive }) => sidebarMenuButtonClass(isActive);

  const initials = user.name
    .split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || 'U';

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Procurement Officer' : 'Supplier';

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarRoot>
        {/* Logo */}
        <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
            <LogoMark size={32} />
            <SidebarLabel className="leading-tight min-w-0">
              <p className="text-sm font-bold text-foreground tracking-tight">TenderRank</p>
              <p className="text-[10px] font-medium text-muted-foreground">Procurement Portal</p>
            </SidebarLabel>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-2 py-3 space-y-4">

          {role === 'super_admin' && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/super-admin" end className={linkClass}>
                      <LayoutDashboard size={15} className="shrink-0" /><SidebarLabel>Overview</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/super-admin/queue" className={linkClass}>
                      <ClipboardCheck size={15} className="shrink-0" /><SidebarLabel>Approval Queue</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/super-admin/tenders" className={linkClass}>
                      <ListCollapse size={15} className="shrink-0" /><SidebarLabel>All Tenders</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/super-admin/users" className={linkClass}>
                      <Users size={15} className="shrink-0" /><SidebarLabel>User Management</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/super-admin/messages" className={linkClass}>
                      <span className="relative flex items-center shrink-0">
                        <MessageSquare size={15} />
                        {unreadMessages > 0 && (
                          <Badge
                            variant="default"
                            className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 justify-center rounded-full p-0 px-1 text-[8px] bg-primary text-primary-foreground border-transparent group-data-[state=collapsed]:-top-1 group-data-[state=collapsed]:-right-1"
                          >
                            {unreadMessages}
                          </Badge>
                        )}
                      </span>
                      <SidebarLabel>Messages</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}

          {role === 'admin' && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Main</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/dashboard" end className={linkClass}>
                      <LayoutDashboard size={15} className="shrink-0" /><SidebarLabel>Overview</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/tenders" className={linkClass}>
                      <ListCollapse size={15} className="shrink-0" /><SidebarLabel>My Tenders</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/create-tender" className={linkClass}>
                      <FilePlus size={15} className="shrink-0" /><SidebarLabel>Create Tender</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Evaluation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <NavLink to="/rankings" className={linkClass}>
                      <Trophy size={15} className="shrink-0" /><SidebarLabel>Rankings</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <NavLink to="/rankings" className={linkClass}>
                      <BarChart2 size={15} className="shrink-0" /><SidebarLabel>Analytics</SidebarLabel>
                    </NavLink>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}

          {role === 'supplier' && (
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavLink to="/supplier" end className={linkClass}>
                    <LayoutDashboard size={15} className="shrink-0" /><SidebarLabel>Overview</SidebarLabel>
                  </NavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink to="/supplier/tenders" className={linkClass}>
                    <ListCollapse size={15} className="shrink-0" /><SidebarLabel>Open Tenders</SidebarLabel>
                  </NavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <NavLink to="/profile" className={linkClass}>
                    <Building2 size={15} className="shrink-0" /><SidebarLabel>My Profile</SidebarLabel>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Site</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/" end className={linkClass}>
                  <Home size={15} className="shrink-0" /><SidebarLabel>Public Home</SidebarLabel>
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* User + logout */}
        <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-sidebar-accent/60 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:bg-transparent">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <SidebarLabel className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {role === 'super_admin'
                  ? <ShieldCheck size={9} className="text-warning shrink-0" />
                  : role === 'admin'
                    ? <ShieldCheck size={9} className="text-primary shrink-0" />
                    : <UserIcon size={9} className="text-primary/70 shrink-0" />
                }
                <p className="text-[9px] font-medium text-muted-foreground">{roleLabel}</p>
              </div>
            </SidebarLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg shrink-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-data-[state=collapsed]:hidden"
                >
                  <LogOut size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </SidebarRoot>
    </TooltipProvider>
  );
};

export default Sidebar;
