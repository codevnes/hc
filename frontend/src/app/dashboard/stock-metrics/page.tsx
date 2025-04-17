'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import StockChart from '@/components/charts/StockChart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  getStockMetricsBySymbol, 
  getStockMetricsByDateRange, 
  getStockMetricsBySymbolAndDate,
  getAllStockMetrics,
  createStockMetrics,
  updateStockMetrics,
  deleteStockMetrics,
  importStockMetricsFromCSV,
  updateStockMetricsById,
  deleteStockMetricsById
} from '@/services/stockMetricsService';
import { StockMetrics } from '@/services/stockDataTypes';
import { Stock } from '@/services/stockService';

export default function StockMetricsPage() {
  const [metrics, setMetrics] = useState<StockMetrics[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<StockMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  
  // CRUD state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<StockMetrics | null>(null);
  const [formData, setFormData] = useState<Partial<StockMetrics>>({
    id: undefined,
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    roa: 0,
    roe: 0,
    tb_roa_nganh: 0,
    tb_roe_nganh: 0
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch all metrics function
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getAllStockMetrics(500, 0);
      setMetrics(data);
      setFilteredMetrics(data);
      
      // Extract unique symbols
      const symbols = [...new Set(data.map((item: StockMetrics) => item.symbol))];
      setStockSymbols(symbols.filter((symbol): symbol is string => typeof symbol === 'string'));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all metrics on initial load
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  // Apply filters when filter criteria change
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      try {
        let filteredData: StockMetrics[] = [];
        
        if (symbol && symbol !== 'all' && startDate && endDate) {
          // Filter by symbol and date range
          const data = await getStockMetricsByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            symbol
          );
          filteredData = data;
        } else if (startDate && endDate) {
          // Filter by date range only
          const data = await getStockMetricsByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          filteredData = data;
        } else if (symbol && symbol !== 'all') {
          // Filter by symbol only
          const data = await getStockMetricsBySymbol(symbol);
          filteredData = data;
        } else {
          // No filters, use all metrics
          filteredData = metrics;
        }
        
        // Apply search term filter if any
        if (searchTerm) {
          filteredData = filteredData.filter(
            (item) => 
              item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setFilteredMetrics(filteredData);
      } catch (error) {
        console.error('Lỗi khi lọc dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    applyFilters();
  }, [symbol, startDate, endDate, searchTerm]);
  
  // Format number for display
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    return Number(value).toFixed(2);
  };
  
  // Prepare data for charts
  const prepareChartData = () => {
    // First, create a map to ensure unique timestamps
    const dataMap = new Map();
    
    // Process each metric
    filteredMetrics.forEach(item => {
      const timestamp = new Date(item.date).getTime();
      
      // If we already have an entry for this timestamp, update it
      // Otherwise, create a new entry
      dataMap.set(timestamp, {
        symbol: item.symbol,
        date: item.date,
        open: item.roa,
        high: item.roe,
        low: item.tb_roa_nganh,
        close: item.tb_roe_nganh,
        trend_q: item.roe,
        fq: item.roa,
        stock_name: item.stock_name
      });
    });
    
    // Convert map to array and sort by timestamp
    return Array.from(dataMap.entries())
      .sort((a, b) => a[0] - b[0])  // Sort by timestamp (ascending)
      .map(entry => entry[1]);      // Return just the data objects
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSymbol('all');
    setStartDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    setEndDate(new Date());
    setSearchTerm('');
  };

  // Handle input change for form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'symbol' ? value.toUpperCase() : 
              ['roa', 'roe', 'tb_roa_nganh', 'tb_roe_nganh'].includes(name) ? parseFloat(value) : value
    });
  };

  // Handle symbol selection in form
  const handleFormSymbolChange = (value: string) => {
    setFormData({
      ...formData,
      symbol: value
    });
  };

  // Handle date change in form
  const handleFormDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date: date.toISOString().split('T')[0]
      });
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      id: undefined,
      symbol: '',
      date: new Date().toISOString().split('T')[0],
      roa: 0,
      roe: 0,
      tb_roa_nganh: 0,
      tb_roe_nganh: 0
    });
    setError(null);
    setSuccess(null);
  };

  // Open edit dialog
  const handleOpenEditDialog = (metric: StockMetrics) => {
    setSelectedMetric(metric);
    setFormData({
      id: metric.id,
      symbol: metric.symbol,
      date: metric.date,
      roa: metric.roa,
      roe: metric.roe,
      tb_roa_nganh: metric.tb_roa_nganh,
      tb_roe_nganh: metric.tb_roe_nganh
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (metric: StockMetrics) => {
    setSelectedMetric(metric);
    setIsDeleteDialogOpen(true);
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Create new stock metrics
  const handleCreateMetrics = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!formData.symbol || !formData.date) {
        setError('Mã cổ phiếu và ngày là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      await createStockMetrics(formData as StockMetrics);
      setSuccess('Tạo chỉ số thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        resetFormData();
        fetchMetrics();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo chỉ số');
      setIsSubmitting(false);
    }
  };

  // Update existing stock metrics
  const handleUpdateMetrics = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!selectedMetric || !selectedMetric.id) {
        setError('Không thể cập nhật chỉ số');
        setIsSubmitting(false);
        return;
      }

      await updateStockMetricsById(
        selectedMetric.id,
        formData
      );
      setSuccess('Cập nhật chỉ số thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsEditDialogOpen(false);
        resetFormData();
        fetchMetrics();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chỉ số');
      setIsSubmitting(false);
    }
  };

  // Delete stock metrics
  const handleDeleteMetrics = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!selectedMetric || !selectedMetric.id) {
        setError('Không thể xóa chỉ số');
        setIsSubmitting(false);
        return;
      }

      await deleteStockMetricsById(
        selectedMetric.id
      );
      setSuccess('Xóa chỉ số thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setSelectedMetric(null);
        fetchMetrics();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa chỉ số');
      setIsSubmitting(false);
    }
  };

  // Import stock metrics from CSV
  const handleImportMetrics = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!importFile) {
        setError('Vui lòng chọn file CSV để nhập');
        setIsSubmitting(false);
        return;
      }

      await importStockMetricsFromCSV(importFile);
      setSuccess('Nhập dữ liệu từ CSV thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchMetrics();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu từ CSV');
      setIsSubmitting(false);
    }
  };

  // Handle download sample CSV
  const handleDownloadSampleCSV = () => {
    // Create sample data
    const sampleData = [
      {
        symbol: 'VNM',
        date: '2023-01-01',
        roa: 10.5,
        roe: 15.2,
        tb_roa_nganh: 8.7,
        tb_roe_nganh: 12.3
      },
      {
        symbol: 'FPT',
        date: '2023-01-01',
        roa: 11.2,
        roe: 16.8,
        tb_roa_nganh: 9.1,
        tb_roe_nganh: 13.5
      }
    ];

    // Convert to CSV
    const headers = ['symbol', 'date', 'roa', 'roe', 'tb_roa_nganh', 'tb_roe_nganh'];
    const csvRows = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(field => row[field as keyof typeof row]).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_metrics_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Chỉ số hiệu suất cổ phiếu</CardTitle>
            <CardDescription>
              Phân tích các chỉ số ROA, ROE và so sánh với chỉ số trung bình ngành
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetFormData}>Tạo mới</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Thêm chỉ số mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin chỉ số ROA, ROE cho cổ phiếu
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="symbol" className="text-right">Mã CP</Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      className="col-span-3"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      placeholder="VNM"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Ngày</Label>
                    <div className="col-span-3">
                      <DatePicker 
                        date={formData.date ? new Date(formData.date) : undefined} 
                        setDate={handleFormDateChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="roa" className="text-right">ROA (%)</Label>
                    <Input
                      id="roa"
                      name="roa"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={formData.roa || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="roe" className="text-right">ROE (%)</Label>
                    <Input
                      id="roe"
                      name="roe"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={formData.roe || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tb_roa_nganh" className="text-right">ROA TB ngành</Label>
                    <Input
                      id="tb_roa_nganh"
                      name="tb_roa_nganh"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={formData.tb_roa_nganh || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tb_roe_nganh" className="text-right">ROE TB ngành</Label>
                    <Input
                      id="tb_roe_nganh"
                      name="tb_roe_nganh"
                      type="number"
                      step="0.01"
                      className="col-span-3"
                      value={formData.tb_roe_nganh || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleCreateMetrics}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Lưu'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Nhập từ CSV</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nhập dữ liệu từ file CSV</DialogTitle>
                  <DialogDescription>
                    Tải lên file CSV chứa dữ liệu chỉ số cổ phiếu
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="csvFile" className="text-right">File CSV</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      className="col-span-3"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      File CSV cần có các cột: symbol, date, roa, roe, tb_roa_nganh, tb_roe_nganh
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownloadSampleCSV}
                      className="w-full"
                    >
                      Tải xuống mẫu CSV
                    </Button>
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleImportMetrics}
                    disabled={isSubmitting || !importFile}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Nhập dữ liệu'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex flex-col space-y-2">
              <label htmlFor="symbol" className="text-sm font-medium">Mã cổ phiếu</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Chọn mã CP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {stockSymbols.map((sym) => (
                    <SelectItem key={sym} value={sym}>{sym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="search" className="text-sm font-medium">Tìm kiếm</label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-[200px]"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Mã CP</TableHead>
                    <TableHead>Tên cổ phiếu</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>ROA (%)</TableHead>
                    <TableHead>ROE (%)</TableHead>
                    <TableHead>ROA TB ngành (%)</TableHead>
                    <TableHead>ROE TB ngành (%)</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMetrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMetrics.map((item) => (
                      <TableRow key={`${item.symbol}-${item.date}`}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-medium">{item.symbol}</TableCell>
                        <TableCell>{item.stock_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{formatNumber(item.roa)}</TableCell>
                        <TableCell>{formatNumber(item.roe)}</TableCell>
                        <TableCell>{formatNumber(item.tb_roa_nganh)}</TableCell>
                        <TableCell>{formatNumber(item.tb_roe_nganh)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(item)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(item)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!loading && filteredMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ ROA/ROE</CardTitle>
              <CardDescription>
                So sánh tỷ suất sinh lời trên tổng tài sản (ROA) và tỷ suất sinh lời trên vốn chủ sở hữu (ROE)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockChart 
                data={prepareChartData()}
                chartType="line"
                lineOptions={{
                  fields: ['trend_q', 'fq'],
                  colors: ['#22c55e', '#3b82f6']
                }}
                height={300}
                title={symbol ? `Biểu đồ ROA/ROE - ${symbol}` : 'Biểu đồ ROA/ROE'}
              />
              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-2"></div>
                  <span>ROE</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                  <span>ROA</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>So sánh với trung bình ngành</CardTitle>
              <CardDescription>
                So sánh ROA/ROE với chỉ số trung bình ngành
              </CardDescription>
            </CardHeader>
            <CardContent>
              {symbol ? (
                <StockChart 
                  data={prepareChartData()}
                  chartType="line"
                  lineOptions={{
                    fields: ['fq', 'trend_q'],
                    colors: ['#3b82f6', '#94a3b8']
                  }}
                  height={300}
                  title="ROA vs TB ngành"
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Vui lòng chọn một mã cổ phiếu để xem biểu đồ so sánh
                </div>
              )}
              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                  <span>ROA</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#94a3b8] mr-2"></div>
                  <span>ROA TB ngành</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!loading && filteredMetrics.length > 0 && symbol && (
        <Card>
          <CardHeader>
            <CardTitle>Phân tích chi tiết {symbol}</CardTitle>
            <CardDescription>
              Hiệu suất ROA/ROE theo thời gian và so sánh với trung bình ngành
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">ROE so với trung bình ngành</h3>
                <StockChart 
                  data={prepareChartData()}
                  chartType="line"
                  lineOptions={{
                    fields: ['trend_q', 'fq'],
                    colors: ['#22c55e', '#94a3b8']
                  }}
                  height={250}
                />
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-2"></div>
                    <span>ROE</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#94a3b8] mr-2"></div>
                    <span>ROE TB ngành</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">ROA gần nhất</div>
                      <div className="text-2xl font-bold">
                        {filteredMetrics.length > 0 ? 
                          formatNumber(filteredMetrics[0].roa) + '%' : 
                          'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">ROE gần nhất</div>
                      <div className="text-2xl font-bold">
                        {filteredMetrics.length > 0 ? 
                          formatNumber(filteredMetrics[0].roe) + '%' : 
                          'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">ROA TB ngành</div>
                      <div className="text-2xl font-bold">
                        {filteredMetrics.length > 0 ? 
                          formatNumber(filteredMetrics[0].tb_roa_nganh) + '%' : 
                          'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">ROE TB ngành</div>
                      <div className="text-2xl font-bold">
                        {filteredMetrics.length > 0 ? 
                          formatNumber(filteredMetrics[0].tb_roe_nganh) + '%' : 
                          'N/A'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Phân tích ROA/ROE</h3>
                  <p className="text-sm text-muted-foreground">
                    ROA (Return on Assets) cho biết hiệu quả sử dụng tài sản của công ty trong việc tạo ra lợi nhuận. 
                    ROE (Return on Equity) đo lường khả năng sinh lời trên vốn chủ sở hữu.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Công ty có ROA và ROE cao hơn trung bình ngành thường có lợi thế cạnh tranh mạnh 
                    và quản lý hiệu quả hơn.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chỉ số</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chỉ số ROA, ROE cho cổ phiếu {selectedMetric?.symbol}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">Mã CP</Label>
              <Input
                id="symbol"
                name="symbol"
                className="col-span-3"
                value={formData.symbol}
                onChange={handleInputChange}
                disabled={true}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Ngày</Label>
              <div className="col-span-3">
                <DatePicker 
                  date={formData.date ? new Date(formData.date) : undefined} 
                  setDate={handleFormDateChange}
                  disabled={true}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roa" className="text-right">ROA (%)</Label>
              <Input
                id="roa"
                name="roa"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.roa || 0}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roe" className="text-right">ROE (%)</Label>
              <Input
                id="roe"
                name="roe"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.roe || 0}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tb_roa_nganh" className="text-right">ROA TB ngành</Label>
              <Input
                id="tb_roa_nganh"
                name="tb_roa_nganh"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.tb_roa_nganh || 0}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tb_roe_nganh" className="text-right">ROE TB ngành</Label>
              <Input
                id="tb_roe_nganh"
                name="tb_roe_nganh"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.tb_roe_nganh || 0}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
          
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleUpdateMetrics}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa chỉ số (ID: {selectedMetric?.id}) của {selectedMetric?.symbol} vào ngày {selectedMetric?.date ? new Date(selectedMetric.date).toLocaleDateString('vi-VN') : ''}?
              <br />
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteMetrics();
              }}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
