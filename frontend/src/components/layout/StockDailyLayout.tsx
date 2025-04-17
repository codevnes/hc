'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChartLine, FaDatabase, FaTable, FaChartBar, FaCalendarAlt } from 'react-icons/fa';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from './DashboardLayout';

interface StockDailyLayoutProps {
  children: ReactNode;
}

const StockDailyLayout = ({ children }: StockDailyLayoutProps) => {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Main title */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý Dữ liệu Giao dịch Hàng ngày</h1>
        </div>

        {/* Secondary navigation */}
        <div className="border-b border-border">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <NavTab 
                value="all" 
                icon={<FaDatabase />} 
                href="/dashboard/stock-daily"
                currentPath={pathname}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              >
                Tất cả dữ liệu
              </NavTab>
              <NavTab 
                value="by-symbol" 
                icon={<FaTable />} 
                href="/dashboard/stock-daily/by-symbol"
                currentPath={pathname}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              >
                Theo mã chứng khoán
              </NavTab>
              <NavTab 
                value="by-date" 
                icon={<FaCalendarAlt />} 
                href="/dashboard/stock-daily/by-date"
                currentPath={pathname}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              >
                Theo ngày
              </NavTab>
              <NavTab 
                value="charts" 
                icon={<FaChartBar />} 
                href="/dashboard/stock-daily/charts"
                currentPath={pathname}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              >
                Biểu đồ
              </NavTab>
            </TabsList>
          </Tabs>
        </div>

        {/* Main content */}
        {children}
      </div>
    </DashboardLayout>
  );
};

// Helper component for navigation tabs
interface NavTabProps {
  value: string;
  icon: ReactNode;
  children: ReactNode;
  href: string;
  currentPath: string;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const NavTab = ({ value, icon, children, href, currentPath, activeTab, setActiveTab }: NavTabProps) => {
  const isActive = currentPath === href || (href !== '/dashboard/stock-daily' && currentPath.startsWith(href));
  
  // If the path matches, update the active tab
  React.useEffect(() => {
    if (isActive && activeTab !== value) {
      setActiveTab(value);
    }
  }, [isActive, activeTab, value, setActiveTab]);

  return (
    <TabsTrigger 
      value={value} 
      className="flex items-center gap-2 px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
      asChild
    >
      <Link href={href} className="flex items-center gap-2">
        {icon}
        <span>{children}</span>
      </Link>
    </TabsTrigger>
  );
};

export default StockDailyLayout;
