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
import { 
  getAllStockEPS,
  getStockEPSBySymbol,
  getStockEPSByDateRange,
  getStockEPSBySymbolAndDate,
  createStockEPS,
  updateStockEPS,
  deleteStockEPS,
  importStockEPSFromCSV,
  updateStockEPSById,
  deleteStockEPSById,
  deleteMultipleStockEPSByIds,
  validateCSVBeforeImport
} from '@/services/stockEPSService';
import { StockEPS } from '@/services/stockDataTypes';
import { Stock } from '@/services/stockService';

export default function StockEPSPage() {
  const [epsData, setEpsData] = useState<StockEPS[]>([]);
  const [filteredEpsData, setFilteredEpsData] = useState<StockEPS[]>([]);
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
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedEPS, setSelectedEPS] = useState<StockEPS | null>(null);
  const [selectedItems, setSelectedItems] = useState<StockEPS[]>([]);
  const [formData, setFormData] = useState<Partial<StockEPS>>({
    symbol: '',
    date: new Date().toISOString().split('T')[0],
    eps: 0,
    eps_nganh: 0
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  
  // Fetch all EPS data function
  const fetchEPSData = async () => {
    try {
      setLoading(true);
      const data = await getAllStockEPS(500, 0);
      setEpsData(data);
      setFilteredEpsData(data);
      
      // Extract unique symbols
      const symbols = [...new Set(data.map((item: StockEPS) => item.symbol))];
      setStockSymbols(symbols.filter((symbol): symbol is string => typeof symbol === 'string'));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all EPS data on initial load
  useEffect(() => {
    fetchEPSData();
  }, []);
  
  // Apply filters when filter criteria change
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      try {
        let filteredData: StockEPS[] = [];
        
        if (symbol && symbol !== 'all' && startDate && endDate) {
          // Filter by symbol and date range
          const data = await getStockEPSByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            symbol
          );
          filteredData = data;
        } else if (startDate && endDate) {
          // Filter by date range only
          const data = await getStockEPSByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          filteredData = data;
        } else if (symbol && symbol !== 'all') {
          // Filter by symbol only
          const data = await getStockEPSBySymbol(symbol);
          filteredData = data;
        } else {
          // No filters, use all EPS data
          filteredData = epsData;
        }
        
        // Apply search term filter if any
        if (searchTerm) {
          filteredData = filteredData.filter(
            (item) => 
              item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setFilteredEpsData(filteredData);
      } catch (error) {
        console.error('Lỗi khi lọc dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    applyFilters();
  }, [symbol, startDate, endDate, searchTerm, epsData]);

  // Format number for display
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    return Number(value).toFixed(2);
  };
  
  // Prepare data for charts
  const prepareChartData = () => {
    // First, create a map to ensure unique timestamps
    const dataMap = new Map();
    
    // Process each EPS data point
    filteredEpsData.forEach(item => {
      const timestamp = new Date(item.date).getTime();
      
      // If we already have an entry for this timestamp, update it
      // Otherwise, create a new entry
      dataMap.set(timestamp, {
        symbol: item.symbol,
        date: item.date,
        open: item.eps,
        high: item.eps_nganh,
        low: 0,
        close: 0,
        trend_q: item.eps,
        fq: item.eps_nganh,
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
              ['eps', 'eps_nganh'].includes(name) ? parseFloat(value) : value
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
      symbol: '',
      date: new Date().toISOString().split('T')[0],
      eps: 0,
      eps_nganh: 0
    });
    setError(null);
    setSuccess(null);
  };

  // Open edit dialog
  const handleOpenEditDialog = (epsItem: StockEPS) => {
    setSelectedEPS(epsItem);
    setFormData({
      symbol: epsItem.symbol,
      date: epsItem.date,
      eps: epsItem.eps,
      eps_nganh: epsItem.eps_nganh
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (epsItem: StockEPS) => {
    setSelectedEPS(epsItem);
    setIsDeleteDialogOpen(true);
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle download sample CSV
  const handleDownloadSampleCSV = () => {
    // Create sample data
    const sampleData = [
      {
        symbol: 'VNM',
        date: '2023-01-01',
        eps: 3500,
        eps_nganh: 2800
      },
      {
        symbol: 'FPT',
        date: '2023-01-01',
        eps: 4200,
        eps_nganh: 3100
      }
    ];

    // Convert to CSV
    const headers = ['symbol', 'date', 'eps', 'eps_nganh'];
    const csvRows = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(field => row[field as keyof typeof row]).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    // Thêm comment giải thích về format ở đầu file
    const csvWithNotes = 
`# Mẫu file CSV để nhập dữ liệu EPS
# Lưu ý:
# - Tất cả các cột đều bắt buộc
# - Cột date phải có định dạng YYYY-MM-DD (VD: 2023-01-01)
# - Các định dạng ngày khác như DD/MM/YYYY cũng có thể được chấp nhận và tự động chuyển đổi
# - Các giá trị số không nên có dấu phẩy phân cách hàng nghìn
#
${csvContent}`;

    // Create and download file
    const blob = new Blob([csvWithNotes], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_eps_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create new EPS data
  const handleCreateEPS = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!formData.symbol || !formData.date) {
        setError('Mã cổ phiếu và ngày là bắt buộc');
        setIsSubmitting(false);
        return;
      }

      await createStockEPS(formData as StockEPS);
      setSuccess('Tạo dữ liệu EPS thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        resetFormData();
        fetchEPSData();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo dữ liệu EPS');
      setIsSubmitting(false);
    }
  };

  // Update existing EPS data
  const handleUpdateEPS = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!selectedEPS || !selectedEPS.id) {
        setError('Không thể cập nhật dữ liệu EPS');
        setIsSubmitting(false);
        return;
      }

      await updateStockEPSById(
        selectedEPS.id,
        formData
      );
      setSuccess('Cập nhật dữ liệu EPS thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsEditDialogOpen(false);
        resetFormData();
        fetchEPSData();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dữ liệu EPS');
      setIsSubmitting(false);
    }
  };

  // Delete EPS data
  const handleDeleteEPS = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!selectedEPS || !selectedEPS.id) {
        setError('Không thể xóa dữ liệu EPS');
        setIsSubmitting(false);
        return;
      }

      try {
        await deleteStockEPSById(selectedEPS.id);
        setSuccess('Xóa dữ liệu EPS thành công');
      } catch (deleteError: any) {
        // Nếu lỗi là không tìm thấy dữ liệu, có thể dữ liệu đã bị xóa hoặc ID không tồn tại
        if (deleteError.response?.data?.message === 'Không tìm thấy dữ liệu stock_eps') {
          setSuccess('Dữ liệu không còn tồn tại hoặc đã được xóa trước đó');
        } else {
          throw deleteError;
        }
      }

      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        setSelectedEPS(null);
        fetchEPSData();
      }, 1500);
    } catch (error: any) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa dữ liệu EPS');
      setIsSubmitting(false);
    }
  };

  // Import EPS data from CSV
  const handleImportEPS = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!importFile) {
        setError('Vui lòng chọn file CSV để nhập');
        setIsSubmitting(false);
        return;
      }

      // Kiểm tra định dạng CSV trước khi gửi lên server
      const validationResult = await validateCSVBeforeImport(importFile);
      
      if (!validationResult.isValid) {
        // Hiển thị các lỗi từ validation
        const errorMessage = validationResult.errors.length > 3 
          ? `${validationResult.errors.slice(0, 3).join('\n')}...\nVà ${validationResult.errors.length - 3} lỗi khác.`
          : validationResult.errors.join('\n');
          
        setError(`Lỗi trong file CSV:\n${errorMessage}`);
        setIsSubmitting(false);
        return;
      }

      await importStockEPSFromCSV(importFile);
      setSuccess('Nhập dữ liệu từ CSV thành công');
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchEPSData();
      }, 1500);
    } catch (error: any) {
      // Hiển thị lỗi một cách thân thiện với người dùng
      let errorMessage = 'Có lỗi xảy ra khi nhập dữ liệu từ CSV';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response?.data?.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Bulk delete EPS data
  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (selectedItems.length === 0) {
        setError('Không có dữ liệu nào được chọn để xóa');
        setIsSubmitting(false);
        return;
      }

      // Lấy danh sách id từ các mục đã chọn (chỉ lấy các mục có id)
      const ids = selectedItems
        .filter(item => item.id !== undefined)
        .map(item => item.id as number);
      
      if (ids.length === 0) {
        setError('Không tìm thấy ID hợp lệ để xóa');
        setIsSubmitting(false);
        return;
      }

      try {
        // Sử dụng hàm xóa nhiều mục theo ID
        const result = await deleteMultipleStockEPSByIds(ids);
        
        // Kiểm tra xem kết quả có chứa thông báo tùy chỉnh không
        if (result && result.message) {
          setSuccess(result.message);
        } else {
          setSuccess(`Đã xóa thành công ${ids.length} mục dữ liệu EPS`);
        }
      } catch (deleteError: any) {
        // Xử lý lỗi cụ thể từ API
        if (deleteError.response?.data?.message === 'Không tìm thấy dữ liệu stock_eps') {
          // Nếu không tìm thấy một số ID, vẫn tải lại dữ liệu để hiển thị các mục còn lại
          setSuccess('Một số mục đã được xóa thành công. Đang tải lại dữ liệu...');
        } else {
          throw deleteError; // Re-throw lỗi khác để xử lý ở catch bên ngoài
        }
      }
      
      setIsSubmitting(false);
      
      // Refresh data after a delay
      setTimeout(() => {
        setIsBulkDeleteDialogOpen(false);
        setSelectedItems([]);
        setSelectAll(false);
        fetchEPSData();
      }, 1500);
    } catch (error: any) {
      console.error('Lỗi khi xóa nhiều mục:', error);
      // Nếu lỗi có định dạng tùy chỉnh từ xử lý của chúng ta
      if (error.message) {
        setError(error.message);
      } else {
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa dữ liệu EPS');
      }
      setIsSubmitting(false);
    }
  };

  // Toggle selection of a single item
  const toggleSelectItem = (item: StockEPS) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(
        selected => selected.symbol === item.symbol && selected.date === item.date
      );
      
      if (isSelected) {
        return prev.filter(
          selected => !(selected.symbol === item.symbol && selected.date === item.date)
        );
      } else {
        return [...prev, item];
      }
    });
  };

  // Toggle select all items
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredEpsData]);
    }
    setSelectAll(!selectAll);
  };

  // Check if item is selected
  const isItemSelected = (item: StockEPS) => {
    return selectedItems.some(
      selected => selected.symbol === item.symbol && selected.date === item.date
    );
  };

  // Hiển thị lỗi với format xuống dòng
  const formatErrorMessage = (message: string) => {
    return message.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Thu nhập trên mỗi cổ phiếu (EPS)</CardTitle>
            <CardDescription>
              Phân tích lợi nhuận trên mỗi cổ phiếu và so sánh với chỉ số trung bình ngành
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetFormData}>Tạo mới</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Thêm dữ liệu EPS mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin EPS cho cổ phiếu
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
                    <Label htmlFor="eps" className="text-right">EPS (VND)</Label>
                    <Input
                      id="eps"
                      name="eps"
                      type="number"
                      step="1"
                      className="col-span-3"
                      value={formData.eps || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="eps_nganh" className="text-right">EPS TB ngành</Label>
                    <Input
                      id="eps_nganh"
                      name="eps_nganh"
                      type="number"
                      step="1"
                      className="col-span-3"
                      value={formData.eps_nganh || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleCreateEPS}
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
                    Tải lên file CSV chứa dữ liệu EPS
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
                      File CSV cần có các cột: symbol, date, eps, eps_nganh
                    </p>
                    <div className="text-xs text-muted-foreground mb-2 p-2 border rounded bg-muted/20">
                      <p className="font-medium mb-1">Lưu ý về định dạng:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Cột date chấp nhận các định dạng: YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD</li>
                        <li>Các giá trị EPS phải là số, không có dấu phẩy phân cách hàng nghìn</li>
                        <li>Mã CP phải trùng khớp với dữ liệu trong hệ thống</li>
                      </ul>
                    </div>
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
                
                {error && <div className="text-sm text-red-500 mt-2 max-h-[100px] overflow-y-auto">{formatErrorMessage(error)}</div>}
                {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    onClick={handleImportEPS}
                    disabled={isSubmitting || !importFile}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Nhập dữ liệu'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedItems.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                Xóa ({selectedItems.length})
              </Button>
            )}
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
                    <TableHead className="w-[40px]">
                      <input 
                        type="checkbox" 
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Mã CP</TableHead>
                    <TableHead>Tên cổ phiếu</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>EPS (VND)</TableHead>
                    <TableHead>EPS TB ngành (VND)</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEpsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEpsData.map((item) => (
                      <TableRow key={`${item.symbol}-${item.date}`}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            checked={isItemSelected(item)}
                            onChange={() => toggleSelectItem(item)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>{item.id || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{item.symbol}</TableCell>
                        <TableCell>{item.stock_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell>{formatNumber(item.eps)}</TableCell>
                        <TableCell>{formatNumber(item.eps_nganh)}</TableCell>
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
          
          {!loading && filteredEpsData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Biểu đồ EPS</CardTitle>
                  <CardDescription>
                    So sánh lợi nhuận trên mỗi cổ phiếu qua thời gian
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
                    title={symbol && symbol !== 'all' ? `Biểu đồ EPS - ${symbol}` : 'Biểu đồ EPS'}
                  />
                  <div className="flex items-center justify-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#22c55e] mr-2"></div>
                      <span>EPS</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                      <span>EPS TB ngành</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>So sánh với trung bình ngành</CardTitle>
                  <CardDescription>
                    So sánh EPS với chỉ số trung bình ngành
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {symbol && symbol !== 'all' ? (
                    <div className="space-y-6">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                              {symbol} vs Ngành
                            </span>
                          </div>
                          {filteredEpsData.length > 0 && (
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-emerald-600">
                                {(filteredEpsData[0].eps && filteredEpsData[0].eps_nganh) ? 
                                  ((filteredEpsData[0].eps / filteredEpsData[0].eps_nganh - 1) * 100).toFixed(2) + '%' 
                                  : 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                        {filteredEpsData.length > 0 && filteredEpsData[0].eps && filteredEpsData[0].eps_nganh && (
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-200">
                            <div 
                              style={{ 
                                width: `${Math.min(Math.max((filteredEpsData[0].eps / filteredEpsData[0].eps_nganh) * 100, 0), 200)}%` 
                              }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">EPS gần nhất</div>
                            <div className="text-2xl font-bold">
                              {filteredEpsData.length > 0 ? 
                                (formatNumber(filteredEpsData[0].eps) + ' VND')
                                : 'N/A'
                              }
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">EPS TB ngành</div>
                            <div className="text-2xl font-bold">
                              {filteredEpsData.length > 0 ? 
                                (formatNumber(filteredEpsData[0].eps_nganh) + ' VND')
                                : 'N/A'
                              }
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        EPS (Earnings Per Share) là chỉ số lợi nhuận trên mỗi cổ phiếu, phản ánh khả năng sinh lời của doanh nghiệp.
                        EPS càng cao càng tốt, và EPS cao hơn trung bình ngành cho thấy công ty có hiệu quả hoạt động tốt hơn so với các đối thủ.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Vui lòng chọn một mã cổ phiếu để xem so sánh chi tiết
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa dữ liệu EPS</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin EPS cho cổ phiếu {selectedEPS?.symbol}
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
              <Label htmlFor="eps" className="text-right">EPS (VND)</Label>
              <Input
                id="eps"
                name="eps"
                type="number"
                step="1"
                className="col-span-3"
                value={formData.eps || 0}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eps_nganh" className="text-right">EPS TB ngành</Label>
              <Input
                id="eps_nganh"
                name="eps_nganh"
                type="number"
                step="1"
                className="col-span-3"
                value={formData.eps_nganh || 0}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
          
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleUpdateEPS}
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
              Bạn có chắc chắn muốn xóa dữ liệu EPS của {selectedEPS?.symbol} vào ngày {selectedEPS?.date ? new Date(selectedEPS.date).toLocaleDateString('vi-VN') : ''}?
              <br />
              <span className="text-muted-foreground text-sm">ID: {selectedEPS?.id}</span>
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
                handleDeleteEPS();
              }}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedItems.length} mục dữ liệu EPS đã chọn?
              <br />
              <div className="text-muted-foreground text-sm mt-2 mb-2">
                <span className="font-medium">IDs:</span> {selectedItems.filter(item => item.id !== undefined).map(item => item.id).join(', ')}
              </div>
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
                handleBulkDelete();
              }}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? 'Đang xử lý...' : `Xóa ${selectedItems.length} mục`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
