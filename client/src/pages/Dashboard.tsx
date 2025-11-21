import React from 'react';
import {
  Routes,
  Route,
  Link,
  useLocation,
  Outlet,
  Navigate
} from 'react-router-dom';
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

// UI Components Imports
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const DashboardPage: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
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
      <div className="lg:col-span-4 space-y-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Content here */}
            <div className="h-32 flex items-center justify-center text-zinc-400 bg-zinc-50 rounded border border-dashed">Chart Placeholder</div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/employees"><Users className="mr-2 h-4 w-4" /> View Directory</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/leaves"><Calendar className="mr-2 h-4 w-4" /> Request Time Off</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export { DashboardPage };