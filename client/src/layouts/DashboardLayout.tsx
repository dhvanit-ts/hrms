import React, { useState } from 'react';
import {
    Link,
    useLocation,
    Outlet
} from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    Menu,
    Search,
    Bell,
    Briefcase,
    LogOut,
    LucideIcon
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Hooks
// import { useAuth } from '@/hooks/use-auth';

/* ----------------------------------------------------------------------------------
 * SIDEBAR COMPONENTS
 * ---------------------------------------------------------------------------------- */

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    path: string;
    collapsed?: boolean;
    onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, collapsed, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <Button
            variant="ghost"
            asChild
            className={`
        w-full justify-start gap-3 px-3 transition-colors
        ${isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900"}
        ${collapsed ? "justify-center px-2" : ""}
      `}
            onClick={onClick}
        >
            <Link to={path}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
            </Link>
        </Button>
    );
};

interface SidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
    // const { user, logout } = useAuth();
    // Mock user for layout display since auth is commented out
    const user = { name: 'User', email: 'user@example.com', avatar: '' };
    const logout = () => console.log('Logout');

    const items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/employees', label: 'Employees', icon: Users },
        { path: '/leaves', label: 'Leaves', icon: Calendar },
        { path: '/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <div className="flex h-full flex-col">
                    {/* Logo Area */}
                    <div className="flex h-14 items-center border-b border-zinc-200 px-6">
                        <div className="flex items-center gap-2 font-bold text-zinc-900">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white">
                                <Briefcase className="h-3.5 w-3.5" />
                            </div>
                            <span>HRMS</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        <div className="px-3 mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Platform
                        </div>
                        {items.map((item) => (
                            <SidebarItem
                                key={item.path}
                                {...item}
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}
                    </div>

                    {/* User Profile Bottom */}
                    <div className="border-t border-zinc-200 p-4">
                        <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 transition-colors cursor-pointer group">
                            <img
                                src={user?.avatar || "https://i.pravatar.cc/150"}
                                alt="User"
                                className="h-8 w-8 rounded-full bg-zinc-200"
                            />
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium text-zinc-900">{user?.name || 'User'}</p>
                                <p className="truncate text-xs text-zinc-500">{user?.email || 'user@example.com'}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={logout}>
                                <LogOut className="h-3.5 w-3.5 text-zinc-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

/* ----------------------------------------------------------------------------------
 * MAIN LAYOUT WRAPPER
 * ---------------------------------------------------------------------------------- */

export const DashboardLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Extract title from path
    const getTitle = () => {
        const path = location.pathname.split('/')[1];
        return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
    };

    return (
        <div className="flex min-h-screen bg-zinc-50 text-zinc-900 font-sans">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-lg font-semibold">{getTitle()}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input className="w-64 pl-9 bg-zinc-50" placeholder="Search..." />
                        </div>
                        <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5 text-zinc-500" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;