'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import StockChart from '@/components/charts/StockChart';
import { getStocksBySymbol, Stock, StockInfo, getAvailableSymbols } from '@/services/stockService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('VNINDEX');
  const [availableSymbols, setAvailableSymbols] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const symbolsData = await getAvailableSymbols();
        setAvailableSymbols(symbolsData);

        const stocksData = await getStocksBySymbol(selectedSymbol);
        const sortedStocks = stocksData.sort((a: Stock, b: Stock) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setStocks(sortedStocks);

      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu dashboard:', error);
        setError('Không thể tải dữ liệu dashboard.');
        setStocks([]);
        setAvailableSymbols([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, selectedSymbol]);

  const chartData = [...stocks].reverse();

  if (loading && availableSymbols.length === 0) {
    return (
      <>
        <div className="mb-6">
          <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1">
              <Card>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-2">
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
           </div>
           <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-52 w-full" />
           </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chào mừng, {user?.username}!</h1>
        <p className="text-muted-foreground">Chọn một mã chứng khoán để xem chi tiết.</p>
      </div>

       {error && (
         <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
           {error}
         </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Danh sách Mã CK</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[70vh] w-full">
                <div className="p-4 space-y-1">
                  {loading && availableSymbols.length === 0 ? (
                    <>
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </>
                  ) : availableSymbols.length > 0 ? (
                    availableSymbols.map((symbolInfo) => (
                      <Button
                        key={symbolInfo.symbol}
                        variant={selectedSymbol === symbolInfo.symbol ? "secondary" : "ghost"}
                        onClick={() => setSelectedSymbol(symbolInfo.symbol)}
                        className="w-full justify-start text-left h-auto py-2 px-3"
                      >
                        <div>
                           <div className="font-medium">{symbolInfo.symbol}</div>
                           <div className="text-xs text-muted-foreground">{symbolInfo.name}</div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Không có mã nào.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biểu đồ Giá ({selectedSymbol})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && stocks.length === 0 ? <Skeleton className="h-64 w-full" /> : chartData.length > 0 ? (
                <StockChart
                  data={chartData}
                  chartType="candlestick"
                  height={300}
                  title={`${selectedSymbol} - Giá`}
                />
              ) : (
                <p className="text-muted-foreground p-4">Không có dữ liệu giá cho mã này.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trend & FQ ({selectedSymbol})</CardTitle>
            </CardHeader>
            <CardContent>
               {loading && stocks.length === 0 ? <Skeleton className="h-64 w-full" /> : chartData.length > 0 ? (
                <StockChart
                  data={chartData}
                  chartType="line"
                  lineOptions={{
                    fields: ['trend_q', 'fq'],
                    colors: ['#2196F3', '#FF9800']
                  }}
                  height={300}
                  title={`${selectedSymbol} - Trend Q & FQ`}
                />
              ) : (
                <p className="text-muted-foreground p-4">Không có dữ liệu Trend/FQ cho mã này.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QV1 ({selectedSymbol})</CardTitle>
            </CardHeader>
            <CardContent>
               {loading && stocks.length === 0 ? <Skeleton className="h-52 w-full" /> : chartData.length > 0 ? (
                <StockChart
                  data={chartData}
                  chartType="histogram"
                  height={200}
                  title={`${selectedSymbol} - QV1`}
                />
              ) : (
                <p className="text-muted-foreground p-4">Không có dữ liệu QV1 cho mã này.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
