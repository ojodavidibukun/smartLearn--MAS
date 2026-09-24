// SmartLearn MAS - Main Layout
// Provides consistent header, navigation, and footer across all pages

import { Button } from '@/components/ui/button';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLogout } from "../hooks/useLogout";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { markAllNotificationsRead, markNotificationRead, subscribeUserNotifications } from '@/lib/notifications';



interface MainLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export default function MainLayout({ children, showNav = true }: MainLayoutProps) {
  const { logout } = useLogout();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<import('@/types').Notification[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeUserNotifications(user.uid, setNotifications, () => setNotifications([]));
    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;


  const isFacilitator = profile?.role === 'lecturer';
  const navItems = isFacilitator
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Courses', href: '/lecturer/courses' },
        { label: 'Create Course', href: '/lecturer/create-course' },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Explore', href: '/explore' },
        { label: 'My Learning', href: '/learning' },
        { label: 'Performance', href: '/performance' },
        { label: 'Agents', href: '/agents' },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation('/')}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">YL</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">YouLearn</span>
          </div>

          {/* Desktop Navigation */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(item.href)}
                  className="text-sm"
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {showNav && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  )}
                </Button>
                {notificationsOpen && (
                  <div className="absolute right-16 top-14 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="font-semibold">Notifications</h2>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{unreadCount} unread</span>{unreadCount > 0 && <button className="text-xs text-primary underline" onClick={() => user && markAllNotificationsRead(user.uid, notifications)}>Mark all as read</button>}</div>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="py-4 text-sm text-muted-foreground">No notifications yet.</p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`w-full rounded-md border p-3 text-left ${notification.read ? 'border-border bg-background' : 'border-primary/30 bg-primary/5'}`}
                            onClick={() => {
                              if (user && !notification.read) {
                                markNotificationRead(notification.id);
                                setNotifications((current) => current.map((item) =>
                                  item.id === notification.id ? { ...item, read: true } : item,
                                ));
                              }
                              if (notification.actionUrl) setLocation(notification.actionUrl);
                              setNotificationsOpen(false);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium">{notification.title}</span>
                              {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            {showNav && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {showNav && mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="container py-3 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setLocation(item.href);
                    setMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">YouLearn</h3>
              <p className="text-sm text-muted-foreground">
                Personalized E-Learning System
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 YouLearn. Personalized learning for everyone.</p>
            <p>Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
