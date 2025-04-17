'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FaHome,
  FaUser,
  FaList,
  FaSignOutAlt,
  FaPlus,
  FaChartLine,
  FaDatabase,
  FaChartBar,
  FaCoins,
  FaPercentage,
  FaMoneyBill,
  FaBars,
  FaTimes,
  FaCode,
  FaImages
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, logout, loading, token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Đang tải...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Đang chuyển hướng...</div>;
  }

  const navItems = (
    <>
      <NavLink href="/dashboard" icon={<FaHome />} currentPath={pathname}>Trang chủ</NavLink>
      <NavLink href="/dashboard/stock-info" icon={<FaCode />} currentPath={pathname}>Mã chứng khoán</NavLink>
      <NavLink href="/dashboard/stocks" icon={<FaChartLine />} currentPath={pathname}>Quản lý QINDEX</NavLink>
      <NavLink href="/dashboard/stock-daily" icon={<FaDatabase />} currentPath={pathname}>Dữ liệu Giao dịch</NavLink>
      <NavLink href="/dashboard/stock-assets" icon={<FaCoins />} currentPath={pathname}>Tài sản & Vốn</NavLink>
      <NavLink href="/dashboard/stock-metrics" icon={<FaChartBar />} currentPath={pathname}>Chỉ số ROA & ROE</NavLink>
      <NavLink href="/dashboard/stock-eps" icon={<FaMoneyBill />} currentPath={pathname}>EPS & EPS Ngành</NavLink>
      <NavLink href="/dashboard/stock-pe" icon={<FaPercentage />} currentPath={pathname}>PE & PE Ngành</NavLink>
      {isAdmin && (
        <>
          <NavLink href="/dashboard/users" icon={<FaUser />} currentPath={pathname}>Người dùng</NavLink>
          <NavLink href="/dashboard/posts" icon={<FaList />} currentPath={pathname}>Bài viết</NavLink>
          <NavLink href="/dashboard/categories" icon={<FaList />} currentPath={pathname}>Danh mục</NavLink>
          <NavLink href="/dashboard/media" icon={<FaImages />} currentPath={pathname}>Thư viện ảnh</NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block min-w-[240px] w-64 border-r border-border flex-col">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b border-border px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <FaChartLine className="h-6 w-6 text-primary" />
              <span className="">HC Stock</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-4 text-sm font-medium">
              {navItems}
            </nav>
          </ScrollArea>
          <div className="mt-auto p-4 border-t border-border">
            <Button variant="ghost" onClick={logout} className="w-full justify-start">
              <FaSignOutAlt className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex flex-col flex-1">
        <header className="lg:hidden flex h-[60px] items-center gap-4 border-b border-border bg-muted/40 px-6 sticky top-0 z-30">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <FaBars className="h-5 w-5" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-full sm:w-[300px]">
              <div className="flex h-[60px] items-center border-b border-border px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                  <FaChartLine className="h-6 w-6 text-primary" />
                  <span className="">HC Stock</span>
                </Link>
              </div>
              <ScrollArea className="flex-1 overflow-y-auto">
                <nav className="grid gap-2 text-lg font-medium p-4">
                  {React.Children.map(navItems, child => (
                    <SheetClose asChild>
                      {child}
                    </SheetClose>
                  ))}
                </nav>
              </ScrollArea>
              <div className="mt-auto p-4 border-t border-border">
                <SheetClose asChild>
                  <Button variant="ghost" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start">
                    <FaSignOutAlt className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold lg:hidden">
              <FaChartLine className="h-6 w-6 text-primary" />
              <span className="">HC Stock</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper component for navigation links
interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  currentPath: string;
}

const NavLink = ({ href, icon, children, currentPath }: NavLinkProps) => {
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
        }`}
    >
      {icon}
      {children}
    </Link>
  );
};
