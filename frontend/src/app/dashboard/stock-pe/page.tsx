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
  getAllStockPE, 
  getStockPEBySymbol, 
  getStockPEByDateRange, 
  getStockPEBySymbolAndDate,
  createStockPE,
  updateStockPE,
  deleteStockPE,
  importStockPEFromCSV,
  updateStockPEById,
  deleteStockPEById
} from '@/services/stockPEService';
import { StockPE } from '@/services/stockDataTypes';

export default function StockPEPage() {
  const [metrics, setMetrics] = useState<StockPE[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<StockPE[]>([]);
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
  const [selectedMetric, setSelectedMetric] = useState<StockPE | null>(null);
  const [formData, setFormData] = useState<Partial<StockPE>>({
    id: undefined,
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    pe: 0,
    pe_nganh: 0
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Apply filters when filter criteria change
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      try {
        let fetchedData: StockPE[] = []; // Renamed to avoid conflict
        
        if (symbol && symbol !== 'all' && startDate && endDate) {
          // Filter by symbol and date range
          fetchedData = await getStockPEByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            symbol
          );
        } else if (startDate && endDate) {
          // Filter by date range only (handles initial load with default dates)
          fetchedData = await getStockPEByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
        } else if (symbol && symbol !== 'all') {
          // Filter by symbol only
          fetchedData = await getStockPEBySymbol(symbol);
        } else {
          // Fallback: Get all data if no filters are somehow set (or remove this if not needed)
          fetchedData = await getAllStockPE(500, 0); 
        }
        
        // Set the main data state
        setMetrics(fetchedData);

        // Extract unique symbols from the fetched data
        const uniqueSymbols = [...new Set(fetchedData.map((item: StockPE) => item.symbol))];
        setStockSymbols(uniqueSymbols.filter((symbol): symbol is string => typeof symbol === 'string'));
        
        // Apply search term filter if any
        let filteredData = fetchedData;
        if (searchTerm) {
          filteredData = fetchedData.filter(
            (item) => 
              item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setFilteredMetrics(filteredData);
      } catch (error) {
        console.error('Lỗi khi lọc dữ liệu:', error);
        setMetrics([]); // Clear data on error
        setFilteredMetrics([]);
        setStockSymbols([]);
      } finally {
        setLoading(false);
      }
    };
    
    applyFilters(); // This now handles initial load and filter changes

    // We need applyFilters to be accessible outside this useEffect for CRUD updates
    // Option 1: Define applyFilters outside useEffect (might need useCallback)
    // Option 2: Pass applyFilters via a ref (complex)
    // Option 3: Re-fetch within CRUD handlers (simplest for now)

  }, [symbol, startDate, endDate, searchTerm]); // Dependencies remain the same
  
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
        open: item.pe,
        high: item.pe_nganh,
        low: item.pe,
        close: item.pe_nganh,
        trend_q: item.pe,
        fq: item.pe_nganh,
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
              ['pe', 'pe_nganh'].includes(name) ? parseFloat(value) : value
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
      pe: 0,
      pe_nganh: 0
    });
  };

  // Handle open edit dialog
  const handleOpenEditDialog = (metric: StockPE) => {
    setSelectedMetric(metric);
    setFormData({
      id: metric.id,
      symbol: metric.symbol,
      date: metric.date,
      pe: metric.pe,
      pe_nganh: metric.pe_nganh
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle open delete dialog
  const handleOpenDeleteDialog = (metric: StockPE) => {
    setSelectedMetric(metric);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle file change for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Create new stock PE
  const handleCreatePE = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Validate form data
      if (!formData.symbol || !formData.date) {
        setError('Mã CP và Ngày là bắt buộc');
        return;
      }
      
      await createStockPE(formData as StockPE);
      setSuccess('Thêm mới P/E thành công');
      setIsCreateDialogOpen(false);
      resetFormData();
      // Manually trigger re-fetch/filter after creation
      await applyFiltersAfterCRUD(); 
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm P/E');
      console.error('Lỗi khi thêm P/E:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update stock PE
  const handleUpdatePE = async () => {
    if (!selectedMetric || !formData.id) {
      setError('Không tìm thấy thông tin P/E để cập nhật');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Validate form data
      if (!formData.symbol || !formData.date) {
        setError('Mã CP và Ngày là bắt buộc');
        return;
      }
      
      // Ensure date is in YYYY-MM-DD format before sending
      const dataToSend = {
        ...formData,
        date: new Date(formData.date).toISOString().split('T')[0]
      };
      
      await updateStockPEById(formData.id, dataToSend);
      setSuccess('Cập nhật P/E thành công');
      setIsEditDialogOpen(false);
      resetFormData();
      // Manually trigger re-fetch/filter after update
      await applyFiltersAfterCRUD(); 
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật P/E');
      console.error('Lỗi khi cập nhật P/E:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete stock PE
  const handleDeletePE = async () => {
    if (!selectedMetric || !selectedMetric.id) {
      setError('Không tìm thấy thông tin P/E để xóa');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await deleteStockPEById(selectedMetric.id);
      setSuccess('Xóa P/E thành công');
      setIsDeleteDialogOpen(false);
      // Manually trigger re-fetch/filter after deletion
      await applyFiltersAfterCRUD(); 
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa P/E');
      console.error('Lỗi khi xóa P/E:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Import stock PE from CSV
  const handleImportPE = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file CSV để import');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await importStockPEFromCSV(importFile);
      setSuccess('Import dữ liệu P/E thành công');
      setIsImportDialogOpen(false);
      setImportFile(null);
      // Manually trigger re-fetch/filter after import
      await applyFiltersAfterCRUD(); 
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi import dữ liệu P/E');
      console.error('Lỗi khi import P/E:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle download sample CSV
  const handleDownloadSampleCSV = () => {
    const headers = 'symbol,date,pe,pe_nganh\n';
    const sampleData = 'TCB,2023-01-31,10.5,12.3\nVPB,2023-01-31,9.8,12.3\n';
    const csvContent = headers + sampleData;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_import_pe.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to re-apply filters after CRUD operations
  const applyFiltersAfterCRUD = async () => {
    setLoading(true);
    try {
      let fetchedData: StockPE[] = [];
      
      if (symbol && symbol !== 'all' && startDate && endDate) {
        fetchedData = await getStockPEByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          symbol
        );
      } else if (startDate && endDate) {
        fetchedData = await getStockPEByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else if (symbol && symbol !== 'all') {
        fetchedData = await getStockPEBySymbol(symbol);
      } else {
        fetchedData = await getAllStockPE(500, 0);
      }
      
      setMetrics(fetchedData);
      const uniqueSymbols = [...new Set(fetchedData.map((item: StockPE) => item.symbol))];
      setStockSymbols(uniqueSymbols.filter((symbol): symbol is string => typeof symbol === 'string'));
      
      let filteredData = fetchedData;
      if (searchTerm) {
        filteredData = fetchedData.filter(
          (item) => 
            item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      setFilteredMetrics(filteredData);
    } catch (error) {
      console.error('Lỗi khi tải lại dữ liệu sau CRUD:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quản lý dữ liệu P/E (Price/Earning Ratio)</CardTitle>
          <CardDescription>
            Dữ liệu tỷ số giá cổ phiếu trên thu nhập mỗi cổ phiếu (P/E) của các mã cổ phiếu theo thời gian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4 mb-6">
            <div className="flex-1 md:max-w-xs">
              <Label htmlFor="symbol-filter">Mã cổ phiếu</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="symbol-filter" className="w-full">
                  <SelectValue placeholder="Chọn mã CP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {stockSymbols.map((sym) => (
                    <SelectItem key={sym} value={sym}>
                      {sym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 md:max-w-xs">
              <Label>Từ ngày</Label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
              />
            </div>

            <div className="flex-1 md:max-w-xs">
              <Label>Đến ngày</Label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
              />
            </div>

            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="flex space-x-2">
                <Input
                  id="search"
                  placeholder="Nhập mã CP hoặc tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" onClick={handleResetFilters}>
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <div className="space-x-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Thêm mới
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)}
              >
                Import CSV
              </Button>
            </div>
          </div>

          {/* Chart section */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Biểu đồ P/E theo thời gian</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <StockChart 
                    data={prepareChartData()} 
                    chartType="line" 
                    lineOptions={{
                      fields: ['trend_q', 'fq'],
                      colors: ['#2196F3', '#FF9800']
                    }}
                    title="Biểu đồ P/E theo thời gian"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table section */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã CP</TableHead>
                  <TableHead>Tên công ty</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>P/E</TableHead>
                  <TableHead>P/E Ngành</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMetrics.map((item) => (
                    <TableRow key={`${item.symbol}-${item.date}`}>
                      <TableCell className="font-medium">{item.symbol}</TableCell>
                      <TableCell>{item.stock_name || 'N/A'}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{formatNumber(item.pe)}</TableCell>
                      <TableCell>{formatNumber(item.pe_nganh)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditDialog(item)}
                        >
                          Sửa
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleOpenDeleteDialog(item)}
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm mới dữ liệu P/E</DialogTitle>
            <DialogDescription>
              Nhập thông tin P/E cho mã cổ phiếu
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="symbol">Mã cổ phiếu</Label>
              {stockSymbols.length > 0 ? (
                <Select value={formData.symbol} onValueChange={handleFormSymbolChange}>
                  <SelectTrigger id="symbol">
                    <SelectValue placeholder="Chọn mã CP" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockSymbols.map((sym) => (
                      <SelectItem key={sym} value={sym}>
                        {sym}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="VCB, TCB, ..."
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label>Ngày</Label>
              <DatePicker
                date={formData.date ? new Date(formData.date) : undefined}
                setDate={handleFormDateChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pe">P/E</Label>
              <Input
                id="pe"
                name="pe"
                type="number"
                step="0.01"
                value={formData.pe}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pe_nganh">P/E Ngành</Label>
              <Input
                id="pe_nganh"
                name="pe_nganh"
                type="number"
                step="0.01"
                value={formData.pe_nganh}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleCreatePE} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật dữ liệu P/E</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin P/E cho mã {selectedMetric?.symbol}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-symbol">Mã cổ phiếu</Label>
              <Input
                id="edit-symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                readOnly
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label>Ngày</Label>
              <DatePicker
                date={formData.date ? new Date(formData.date) : undefined}
                setDate={handleFormDateChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-pe">P/E</Label>
              <Input
                id="edit-pe"
                name="pe"
                type="number"
                step="0.01"
                value={formData.pe}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-pe_nganh">P/E Ngành</Label>
              <Input
                id="edit-pe_nganh"
                name="pe_nganh"
                type="number"
                step="0.01"
                value={formData.pe_nganh}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleUpdatePE} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dữ liệu P/E của mã {selectedMetric?.symbol} ngày {selectedMetric?.date}?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePE}
              disabled={isSubmitting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import dữ liệu P/E từ CSV</DialogTitle>
            <DialogDescription>
              Tải lên file CSV chứa dữ liệu P/E
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csv-file">File CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                File CSV phải có các cột: symbol, date, pe, pe_nganh
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-fit"
              onClick={handleDownloadSampleCSV}
            >
              Tải mẫu CSV
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleImportPE} 
              disabled={isSubmitting || !importFile}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-md shadow-md">
          {success}
        </div>
      )}
    </div>
  )
}
