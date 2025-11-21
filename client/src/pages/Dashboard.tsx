import React, { useState } from 'react';
import {
  Users,
  Calendar,
  LogOut,
  Shield,
  User as UserIcon,
  LayoutDashboard,
  ChevronRight,
  Bell,
  Search,
  Menu,
  Briefcase,
  FileText,
  Settings,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';

// Assumed imports from your UI library (Shadcn/Origin UI)
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Assumed import for authentication context/hook
// import { useAuth } from '@/hooks/use-auth';

/* ----------------------------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------------------------------- */

type ViewType = 'dashboard' | 'employees' | 'leaves' | 'reports' | 'settings';

/* ----------------------------------------------------------------------------------
 * SUB-COMPONENTS (Sidebar & Layout)
 * ---------------------------------------------------------------------------------- */

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
  id: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`
      flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
      ${active
        ? "bg-zinc-100 text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900"}
      ${collapsed ? "justify-center px-2" : ""}
    `}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span>{label}</span>}
  </button>
);

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, mobileOpen, setMobileOpen }) => {
  // const { user, logout } = useAuth();

  const items: Omit<SidebarItemProps, 'active' | 'onClick' | 'collapsed'>[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
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
              <span>Origin HR</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <div className="px-3 mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Platform
            </div>
            {items.map((item) => (
              <SidebarItem
                key={item.id}
                id={item.id}
                icon={item.icon}
                label={item.label}
                active={currentView === item.id}
                onClick={() => {
                  setView(item.id as ViewType);
                  setMobileOpen(false);
                }}
              />
            ))}
          </div>

          {/* User Profile Bottom */}
          <div className="border-t border-zinc-200 p-4">
            {/* <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 transition-colors cursor-pointer group">
              <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="User" className="h-8 w-8 rounded-full bg-zinc-200" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-zinc-900">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-zinc-500">{user?.email || 'email@example.com'}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={logout}>
                <LogOut className="h-3.5 w-3.5 text-zinc-500" />
              </Button>
            </div> */}
          </div>
        </div>
      </aside>
    </>
  );
};

/* ----------------------------------------------------------------------------------
 * VIEW COMPONENTS
 * ---------------------------------------------------------------------------------- */

const EmployeesView: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Employees</h2>
        <p className="text-sm text-zinc-500">Manage your team and view directory.</p>
      </div>
      <Button>
        <Users className="mr-2 h-4 w-4" />
        Add Employee
      </Button>
    </div>

    <Card>
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search employees..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative w-full overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/50 text-zinc-500">
            <tr>
              <th className="h-10 px-6 font-medium">Employee</th>
              <th className="h-10 px-6 font-medium">Role</th>
              <th className="h-10 px-6 font-medium">Department</th>
              <th className="h-10 px-6 font-medium">Status</th>
              <th className="h-10 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            <tr className="hover:bg-zinc-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium text-xs">
                    AJ
                  </div>
                  <div className="font-medium text-zinc-900">Alice Johnson</div>
                </div>
              </td>
              <td className="px-6 py-4 text-zinc-600">Frontend Dev</td>
              <td className="px-6 py-4 text-zinc-600">Engineering</td>
              <td className="px-6 py-4"><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">Active</Badge></td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </td>
            </tr>
            <tr className="hover:bg-zinc-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
                    BS
                  </div>
                  <div className="font-medium text-zinc-900">Bob Smith</div>
                </div>
              </td>
              <td className="px-6 py-4 text-zinc-600">Product Manager</td>
              <td className="px-6 py-4 text-zinc-600">Product</td>
              <td className="px-6 py-4"><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">Active</Badge></td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </td>
            </tr>
            <tr className="hover:bg-zinc-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-xs">
                    CB
                  </div>
                  <div className="font-medium text-zinc-900">Charlie Brown</div>
                </div>
              </td>
              <td className="px-6 py-4 text-zinc-600">Designer</td>
              <td className="px-6 py-4 text-zinc-600">Design</td>
              <td className="px-6 py-4"><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent">On Leave</Badge></td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const LeavesView: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Leave Management</h2>
        <p className="text-sm text-zinc-500">Track your time off and balances.</p>
      </div>
      <Button>
        <Calendar className="mr-2 h-4 w-4" />
        New Request
      </Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">Annual Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12</div>
          <p className="text-xs text-zinc-400 mt-1">Days remaining of 20</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">Sick Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">5</div>
          <p className="text-xs text-zinc-500 mt-1">Days remaining of 10</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-zinc-900">0</div>
          <p className="text-xs text-zinc-500 mt-1">No active requests</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Recent History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-zinc-200 p-2">
                  <Calendar className="h-4 w-4 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Annual Leave</p>
                  <p className="text-xs text-zinc-500">Aug {12 + i} - Aug {14 + i}, 2024</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-transparent">Approved</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

interface DashboardContentProps {
  setView: (view: ViewType) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ setView }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Employees', value: '124', change: '+4%', icon: Users },
          { label: 'On Leave', value: '8', change: 'Active now', icon: Calendar },
          { label: 'New Hires', value: '12', change: 'This month', icon: UserIcon },
          { label: 'Open Roles', value: '3', change: 'Urgent', icon: Briefcase },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
                <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Content Area */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Employee distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Engineering', count: 45, percent: '45%' },
                  { name: 'Product', count: 12, percent: '12%' },
                  { name: 'Sales', count: 24, percent: '24%' },
                  { name: 'Marketing', count: 18, percent: '18%' },
                ].map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700">{dept.name}</span>
                      <span className="text-zinc-500">{dept.count} members</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100">
                      <div
                        className="h-2 rounded-full bg-zinc-900"
                        style={{ width: dept.percent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions / Profile */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => setView('employees')}>
                <Users className="mr-2 h-4 w-4" /> View Directory
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setView('leaves')}>
                <Calendar className="mr-2 h-4 w-4" /> Request Time Off
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="mr-2 h-4 w-4" /> Security Audit
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 text-zinc-50 border-zinc-900">
            <CardHeader>
              <CardTitle className="text-zinc-50">Pro Feature</CardTitle>
              <CardDescription className="text-zinc-400">Unlock advanced analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300 mb-4">
                Get detailed insights into employee performance and retention rates.
              </p>
              <Button variant="secondary" className="w-full">Upgrade Plan</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------------
 * MAIN DASHBOARD COMPONENT
 * ---------------------------------------------------------------------------------- */

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const renderView = () => {
    switch (currentView) {
      case 'employees':
        return <EmployeesView />;
      case 'leaves':
        return <LeavesView />;
      default:
        return <DashboardContent setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold capitalize">{currentView}</h1>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;