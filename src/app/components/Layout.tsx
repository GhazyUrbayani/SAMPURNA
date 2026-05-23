import { Outlet, NavLink, useNavigate } from 'react-router';
import { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Cpu,
  Bell,
  User,
  LogOut,
  Trash2,
  Menu,
  X,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useNotifications, Notification } from '../hooks/useNotifications';

type NavItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { path: '/dashboard/devices', label: 'Device Management', icon: Cpu, roles: ['admin'] },
];

function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ n, isRead, onClick }: { n: Notification; isRead: boolean; onClick: () => void }) {
  const Icon = n.severity === 'offline' ? WifiOff : AlertTriangle;
  const color =
    n.severity === 'critical' ? 'text-rose-600' :
    n.severity === 'warning' ? 'text-amber-600' :
    'text-gray-500';
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left hover:bg-gray-50 transition border-b last:border-b-0 ${isRead ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">{n.binId}</p>
            {!isRead && <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-600 truncate">{n.location}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">{formatRelative(n.timestamp)}</p>
        </div>
      </div>
    </button>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead, readIds } = useNotifications();

  const visibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBellOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) markAllAsRead();
  };

  return (
    <div className="flex h-[100dvh] bg-gray-50">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="lg:hidden absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#2c5f6f] rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">SAMPURNA</h1>
              <p className="text-xs text-gray-500">Waste Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? 'bg-teal-50 text-[#2c5f6f]' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {user?.role === 'staff' && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              Signed in as <span className="font-semibold">Staff</span>. Some areas are restricted to administrators.
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">System Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#2c5f6f] rounded-full animate-pulse" />
            <span className="text-sm text-gray-700">All Systems Operational</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="min-w-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  IoT Waste Monitoring
                </h2>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Real-time bin capacity tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <DropdownMenu onOpenChange={handleBellOpenChange}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center p-0 px-1 bg-red-500 text-white text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] overflow-y-auto">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="text-xs font-normal text-gray-500">{notifications.length} total</span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-6 flex flex-col items-center text-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-teal-500" />
                      <p className="text-sm font-medium text-gray-700">All clear!</p>
                      <p className="text-xs text-gray-500">No bins require attention right now.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <NotificationItem
                        key={n.id}
                        n={n}
                        isRead={readIds.has(n.id)}
                        onClick={() => {
                          markAsRead(n.id);
                          navigate('/dashboard');
                        }}
                      />
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 sm:px-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-teal-100 text-[#2c5f6f]">
                        {user?.initials ?? '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium leading-tight">{user?.name}</p>
                      <p className="text-xs text-gray-500 leading-tight">{user?.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs font-normal text-gray-500 capitalize">{user?.role} account</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
