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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  getStockDailyBySymbol, 
  getAllStockDaily,
  createStockDaily,
  deleteStockDaily,
  importStockDailyFromCSV,
  updateStockDailyById,
} from '@/services/stockDailyService';
import { StockDaily } from '@/services/stockDataTypes';

export default function StockDailyPage() {
  const [dailyData, setDailyData] = useState<StockDaily[]>([]);
  const [filteredData, setFilteredData] = useState<StockDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedDailyItem, setSelectedDailyItem] = useState<StockDaily | null>(null);
  const [formData, setFormData] = useState<Partial<StockDaily>>({
    id: undefined,
    symbol: '',
    close_price: 0,
    return_value: 0,
    kldd: 0,
    von_hoa: 0,
    pe: 0,
    roa: 0,
    roe: 0,
    eps: 0,
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fetchDailyData = async () => {
    try {
      setLoading(true);
      const data: StockDaily[] = await getAllStockDaily(500, 0); 
      setDailyData(data);
      setFilteredData(data);
      
      const symbols = [...new Set(data.map((item: StockDaily) => item.symbol))];
      setStockSymbols(symbols.filter((symbol): symbol is string => typeof symbol === 'string'));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu hàng ngày:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDailyData();
  }, []);
  
  useEffect(() => {
    const applyFilters = async () => {
      setLoading(true);
      try {
        let filteredResult: StockDaily[] = [];
        
        if (symbol && symbol !== 'all') {
          const data = await getStockDailyBySymbol(symbol);
          filteredResult = data;
        } else {
          filteredResult = dailyData;
        }
        
        if (searchTerm) {
          filteredResult = filteredResult.filter(
            (item) => 
              item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.stock_name && item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setFilteredData(filteredResult);
      } catch (error) {
        console.error('Lỗi khi lọc dữ liệu hàng ngày:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!loading) {
       applyFilters();
    }
  }, [symbol, searchTerm, dailyData]);
  
  const formatNumber = (value: number | undefined, decimals = 2) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(decimals) + ' tỷ';
    }
    if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(decimals) + ' tr';
    }
    if (Math.abs(value) >= 1e3) {
       if (value === Math.floor(value) && decimals === 0) {
           return value.toLocaleString('vi-VN');
       }
       return Number(value).toFixed(decimals);
    }
    return Number(value).toFixed(decimals);
  };
  
  const handleResetFilters = () => {
    setSymbol('all');
    setSearchTerm('');
    setFilteredData(dailyData); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['close_price', 'return_value', 'kldd', 'von_hoa', 'pe', 'roa', 'roe', 'eps'];
    
    setFormData({
      ...formData,
      [name]: name === 'symbol' ? value.toUpperCase() : 
              numericFields.includes(name) ? (value === '' ? undefined : parseFloat(value))
              : value
    });
  };

 
  const resetFormData = () => {
    setFormData({
      id: undefined,
      symbol: '',
      close_price: 0,
      return_value: undefined,
      kldd: undefined,
      von_hoa: undefined,
      pe: undefined,
      roa: undefined,
      roe: undefined,
      eps: undefined,
    });
  };
  
  const handleOpenEditDialog = (item: StockDaily) => {
    setSelectedDailyItem(item);
    setFormData({
      id: item.id,
      symbol: item.symbol,
      close_price: item.close_price,
      return_value: item.return_value,
      kldd: item.kldd,
      von_hoa: item.von_hoa,
      pe: item.pe,
      roa: item.roa,
      roe: item.roe,
      eps: item.eps,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: StockDaily) => {
    setSelectedDailyItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  const handleCreateDailyData = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const dataToCreate: Omit<StockDaily, 'id' | 'stock_name' | 'created_at' | 'updated_at' | 'date'> = {
        symbol: formData.symbol || '',
        close_price: formData.close_price || 0,
        return_value: formData.return_value,
        kldd: formData.kldd,
        von_hoa: formData.von_hoa,
        pe: formData.pe,
        roa: formData.roa,
        roe: formData.roe,
        eps: formData.eps,
      };

      await createStockDaily(dataToCreate as StockDaily);
      setSuccess('Đã tạo dữ liệu hàng ngày thành công.');
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchDailyData();
    } catch (err: any) {
      setError(`Lỗi khi tạo dữ liệu: ${err.message}`);
      console.error('Lỗi khi tạo dữ liệu hàng ngày:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDailyData = async () => {
    if (!selectedDailyItem || !selectedDailyItem.id) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const dataToUpdate: Partial<StockDaily> = {
        symbol: formData.symbol,
        close_price: formData.close_price,
        return_value: formData.return_value,
        kldd: formData.kldd,
        von_hoa: formData.von_hoa,
        pe: formData.pe,
        roa: formData.roa,
        roe: formData.roe,
        eps: formData.eps,
      };
      
      await updateStockDailyById(selectedDailyItem.id, dataToUpdate);
      setSuccess('Đã cập nhật dữ liệu hàng ngày thành công.');
      setIsEditDialogOpen(false);
      resetFormData();
      setSelectedDailyItem(null);
      fetchDailyData();
    } catch (err: any) {
      setError(`Lỗi khi cập nhật dữ liệu: ${err.message}`);
      console.error('Lỗi khi cập nhật dữ liệu hàng ngày:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteDailyData = async () => {
    if (!selectedDailyItem || !selectedDailyItem.id) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteStockDaily(selectedDailyItem.id); 
      setSuccess('Đã xóa dữ liệu hàng ngày thành công.');
      setIsDeleteDialogOpen(false);
      setSelectedDailyItem(null);
      fetchDailyData();
    } catch (err: any) {
      setError(`Lỗi khi xóa dữ liệu: ${err.message}`);
      console.error('Lỗi khi xóa dữ liệu hàng ngày:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportDailyData = async () => {
    if (!importFile) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await importStockDailyFromCSV(importFile);
      setSuccess('Đã nhập dữ liệu hàng ngày từ CSV thành công.');
      setIsImportDialogOpen(false);
      setImportFile(null);
      fetchDailyData();
    } catch (err: any) {
      setError(`Lỗi khi nhập dữ liệu hàng ngày từ CSV: ${err.message}`);
      console.error('Lỗi khi nhập dữ liệu hàng ngày từ CSV:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDownloadSampleCSV = () => {
    const csvHeader = "symbol,close_price,return_value,kldd,von_hoa,pe,roa,roe,eps";
    const csvExampleRow1 = "AAPL,175.50,0.01,1000000,2800000000000,28.5,0.25,0.45,6.15";
    const csvExampleRow2 = "GOOG,135.20,-0.005,800000,1700000000000,25.2,0.18,0.28,5.38";
    
    const csvContent = "data:text/csv;charset=utf-8,"
      + csvHeader + "\n"
      + csvExampleRow1 + "\n"
      + csvExampleRow2;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_daily_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dữ liệu chứng khoán hàng ngày</h1>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc dữ liệu chỉ số chứng khoán theo mã hoặc tìm kiếm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mã chứng khoán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mã</SelectItem>
                {stockSymbols.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Tìm kiếm theo mã hoặc tên công ty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetFilters}>Đặt lại</Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button onClick={() => setIsCreateDialogOpen(true)}>Thêm mới</Button>
        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>Nhập từ CSV</Button>
      </div>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chỉ số</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã CK</TableHead>
                  <TableHead className="text-right">Giá đóng cửa</TableHead>
                  <TableHead className="text-right">KLGD (CP)</TableHead>
                  <TableHead className="text-right">Vốn hóa (Tỷ)</TableHead>
                  <TableHead className="text-right">P/E</TableHead>
                  <TableHead className="text-right">Lợi nhuận (%)</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id ?? `${item.symbol}`}>
                    <TableCell>{item.symbol}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.close_price)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.kldd)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.von_hoa)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.pe)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.return_value ? item.return_value * 100 : undefined)}</TableCell>
                    <TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm chỉ số chứng khoán mới</DialogTitle>
            <DialogDescription>Nhập thông tin chi tiết cho chỉ số mới.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">Mã CK</Label>
              <Input 
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="close_price" className="text-right">Giá đóng cửa</Label>
              <Input 
                id="close_price"
                name="close_price"
                type="number"
                step="0.01"
                value={formData.close_price}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kldd" className="text-right">KLGD (CP)</Label>
              <Input 
                id="kldd"
                name="kldd"
                type="number"
                value={formData.kldd}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="von_hoa" className="text-right">Vốn hóa</Label>
              <Input 
                id="von_hoa"
                name="von_hoa"
                type="number"
                value={formData.von_hoa}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pe" className="text-right">P/E</Label>
              <Input 
                id="pe"
                name="pe"
                type="number"
                step="0.01"
                value={formData.pe}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="return_value" className="text-right">Lợi nhuận (%)</Label>
              <Input 
                id="return_value"
                name="return_value"
                type="number"
                step="0.001"
                value={formData.return_value}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roa" className="text-right">ROA (%)</Label>
              <Input 
                id="roa"
                name="roa"
                type="number"
                step="0.01"
                value={formData.roa}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roe" className="text-right">ROE (%)</Label>
              <Input 
                id="roe"
                name="roe"
                type="number"
                step="0.01"
                value={formData.roe}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eps" className="text-right">EPS</Label>
              <Input 
                id="eps"
                name="eps"
                type="number"
                step="0.01"
                value={formData.eps}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateDailyData} disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chỉ số chứng khoán</DialogTitle>
            <DialogDescription>Cập nhật thông tin chi tiết cho chỉ số này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-symbol" className="text-right">Mã CK</Label>
              <Input 
                id="edit-symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange} 
                className="col-span-3" 
                readOnly 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-close_price" className="text-right">Giá đóng cửa</Label>
              <Input 
                id="edit-close_price"
                name="close_price"
                type="number"
                step="0.01"
                value={formData.close_price}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-kldd" className="text-right">KLGD (CP)</Label>
              <Input 
                id="edit-kldd"
                name="kldd"
                type="number"
                value={formData.kldd}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-von_hoa" className="text-right">Vốn hóa</Label>
              <Input 
                id="edit-von_hoa"
                name="von_hoa"
                type="number"
                value={formData.von_hoa}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-pe" className="text-right">P/E</Label>
              <Input 
                id="edit-pe"
                name="pe"
                type="number"
                step="0.01"
                value={formData.pe}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-return_value" className="text-right">Lợi nhuận (%)</Label>
              <Input 
                id="edit-return_value"
                name="return_value"
                type="number"
                step="0.001"
                value={formData.return_value}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roa" className="text-right">ROA (%)</Label>
              <Input 
                id="edit-roa"
                name="roa"
                type="number"
                step="0.01"
                value={formData.roa}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roe" className="text-right">ROE (%)</Label>
              <Input 
                id="edit-roe"
                name="roe"
                type="number"
                step="0.01"
                value={formData.roe}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-eps" className="text-right">EPS</Label>
              <Input 
                id="edit-eps"
                name="eps"
                type="number"
                step="0.01"
                value={formData.eps}
                onChange={handleInputChange} 
                className="col-span-3" 
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetFormData(); setSelectedDailyItem(null); }}>Hủy</Button>
            <Button onClick={handleUpdateDailyData} disabled={isSubmitting}>
              {isSubmitting ? 'Đang cập nhật...' : 'Lưu thay đổi'}
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
              Bạn có chắc chắn muốn xóa dữ liệu hàng ngày này không?
              Mã CK: {selectedDailyItem?.symbol}
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDailyItem(null)} disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDailyData} className="bg-red-500 hover:bg-red-600" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập chỉ số từ CSV</DialogTitle>
            <DialogDescription>
              Chọn tệp CSV để nhập dữ liệu. Tệp phải có các cột: 
              `symbol`, `close_price`, `return_value`, `kldd`, `von_hoa`, `pe`, `roa`, `roe`, `eps`. 
              <Button 
                variant="link"
                className="p-0 h-auto ml-1 text-blue-500"
                onClick={handleDownloadSampleCSV}
              >
                Tải tệp mẫu
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="import-file" className="text-right">Chọn tệp</Label>
              <Input 
                id="import-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="col-span-3"
              />
            </div>
          </div>
          {importFile && <p className="text-sm text-gray-500">Tệp đã chọn: {importFile.name}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportDialogOpen(false); setImportFile(null); }}>Hủy</Button>
            <Button onClick={handleImportDailyData} disabled={!importFile || isSubmitting}>
              {isSubmitting ? 'Đang nhập...' : 'Nhập dữ liệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
