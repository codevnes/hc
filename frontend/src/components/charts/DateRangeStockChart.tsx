'use client';

import React, { useState, useEffect } from 'react';
import { getStocksByDateRange } from '@/services/stockService';
import StockChart from './StockChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

interface DateRangeStockChartProps {
  symbol: string;
  initialStartDate?: Date;
  initialEndDate?: Date;
  height?: number;
  title?: string;
  showDatePickers?: boolean;
  showTimeRangeButtons?: boolean;
}

const DateRangeStockChart: React.FC<DateRangeStockChartProps> = ({
  symbol,
  initialStartDate,
  initialEndDate,
  height = 400,
  title,
  showDatePickers = true,
  showTimeRangeButtons = true,
}) => {
  // Default start date is 1 year ago if not provided
  const defaultStartDate = initialStartDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  // Default end date is today if not provided
  const defaultEndDate = initialEndDate || new Date();

  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Predefined time ranges
  const handleTimeRangeChange = (range: '1m' | '6m' | '1y' | '5y') => {
    const now = new Date();
    let newStartDate = new Date();

    switch (range) {
      case '1m':
        newStartDate.setMonth(now.getMonth() - 1);
        break;
      case '6m':
        newStartDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        newStartDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5y':
        newStartDate.setFullYear(now.getFullYear() - 5);
        break;
    }

    setStartDate(newStartDate);
    setEndDate(now);
  };

  // Fetch data when dates or symbol changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Format dates as YYYY-MM-DD
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Call the API
        const data = await getStocksByDateRange(
          formattedStartDate,
          formattedEndDate,
          symbol
        );

        if (data && data.length > 0) {
          setStockData(data);
        } else {
          setStockData([]);
          setError('Không có dữ liệu cho khoảng thời gian này');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Lỗi khi tải dữ liệu');
        setStockData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, startDate, endDate]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>{title || `Biểu đồ giá ${symbol.toUpperCase()}`}</CardTitle>
        
        {showTimeRangeButtons && (
          <div className="flex space-x-2 mt-2">
            <Button
              variant={startDate.getTime() === new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime() ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('1m')}
            >
              1 tháng
            </Button>
            <Button
              variant={startDate.getTime() === new Date(new Date().setMonth(new Date().getMonth() - 6)).getTime() ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('6m')}
            >
              6 tháng
            </Button>
            <Button
              variant={startDate.getTime() === new Date(new Date().setFullYear(new Date().getFullYear() - 1)).getTime() ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('1y')}
            >
              1 năm
            </Button>
            <Button
              variant={startDate.getTime() === new Date(new Date().setFullYear(new Date().getFullYear() - 5)).getTime() ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange('5y')}
            >
              5 năm
            </Button>
          </div>
        )}
        
        {showDatePickers && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="startDate">Từ ngày</Label>
              <DatePicker
                date={startDate}
                setDate={(date) => date && setStartDate(date)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Đến ngày</Label>
              <DatePicker
                date={endDate}
                setDate={(date) => date && setEndDate(date)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {loading && <div className="flex justify-center py-8">Đang tải dữ liệu...</div>}
        
        {error && !loading && (
          <div className="text-red-500 py-8 text-center">{error}</div>
        )}
        
        {!loading && !error && stockData.length > 0 && (
          <StockChart
            data={stockData}
            chartType="candlestick"
            height={height}
            title=""
          />
        )}
        
        {!loading && !error && stockData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không có dữ liệu cho khoảng thời gian này
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DateRangeStockChart;
