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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getAllStockInfo, 
  getStockInfoById, 
  getStockInfoBySymbol, 
  createStockInfo, 
  updateStockInfo, 
  deleteStockInfo, 
  importStockInfoFromCSV
} from '@/services/stockInfoService';
import { StockInfo, PaginatedResponse } from '@/services/stockInfoService';

export default function StockInfoPage() {
  const [stockInfoData, setStockInfoData] = useState<StockInfo[]>([]);
  const [filteredStockInfo, setFilteredStockInfo] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // CRUD state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMultiDeleteDialogOpen, setIsMultiDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedStockInfo, setSelectedStockInfo] = useState<StockInfo | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState<Partial<StockInfo>>({
    symbol: '',
    name: '',
    description: ''
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch stock info with pagination
  const fetchStockInfo = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<StockInfo> = await getAllStockInfo(
        currentPage,
        limit,
        searchTerm,
        sortBy,
        sortOrder
      );
      setStockInfoData(response.data);
      setFilteredStockInfo(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stock info on initial load and when filters change
  useEffect(() => {
    fetchStockInfo();
  }, [currentPage, limit, searchTerm, sortBy, sortOrder]);
  
  // Handle input change for form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    });
  };
  
  // Reset form data
  const resetFormData = () => {
    setFormData({
      symbol: '',
      name: '',
      description: ''
    });
  };
  
  // Open edit dialog
  const handleOpenEditDialog = (info: StockInfo) => {
    setSelectedStockInfo(info);
    setFormData({
      id: info.id,
      symbol: info.symbol,
      name: info.name,
      description: info.description
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const handleOpenDeleteDialog = (info: StockInfo) => {
    setSelectedStockInfo(info);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle file change for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Create new stock info
  const handleCreateStockInfo = async () => {
    if (!formData.symbol || !formData.name) {
      setError('Mã chứng khoán và tên không được để trống');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await createStockInfo({
        symbol: formData.symbol,
        name: formData.name,
        description: formData.description
      });
      
      setSuccess('Đã thêm thông tin chứng khoán thành công');
      setIsCreateDialogOpen(false);
      resetFormData();
      fetchStockInfo();
    } catch (error) {
      console.error('Lỗi khi tạo thông tin chứng khoán:', error);
      setError('Lỗi khi tạo thông tin chứng khoán');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update stock info
  const handleUpdateStockInfo = async () => {
    if (!selectedStockInfo?.id || !formData.symbol || !formData.name) {
      setError('Mã chứng khoán và tên không được để trống');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateStockInfo(selectedStockInfo.id, {
        symbol: formData.symbol,
        name: formData.name,
        description: formData.description
      });
      
      setSuccess('Đã cập nhật thông tin chứng khoán thành công');
      setIsEditDialogOpen(false);
      resetFormData();
      fetchStockInfo();
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin chứng khoán:', error);
      setError('Lỗi khi cập nhật thông tin chứng khoán');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete stock info
  const handleDeleteStockInfo = async () => {
    if (!selectedStockInfo?.id) {
      setError('Không tìm thấy ID để xóa');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await deleteStockInfo(selectedStockInfo.id);
      
      setSuccess('Đã xóa thông tin chứng khoán thành công');
      setIsDeleteDialogOpen(false);
      fetchStockInfo();
    } catch (error) {
      console.error('Lỗi khi xóa thông tin chứng khoán:', error);
      setError('Lỗi khi xóa thông tin chứng khoán');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Import stock info from CSV
  const handleImportStockInfo = async () => {
    if (!importFile) {
      setError('Vui lòng chọn file để nhập dữ liệu');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      await importStockInfoFromCSV(formData);
      
      setSuccess('Đã nhập dữ liệu chứng khoán thành công');
      setIsImportDialogOpen(false);
      setImportFile(null);
      fetchStockInfo();
    } catch (error) {
      console.error('Lỗi khi nhập dữ liệu:', error);
      setError('Lỗi khi nhập dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };
  
  // Download sample CSV
  const handleDownloadSampleCSV = () => {
    const sampleData = [
      { symbol: 'VHM', name: 'Vinhomes', description: 'Công ty Cổ phần Vinhomes' },
      { symbol: 'VIC', name: 'Vingroup', description: 'Tập đoàn Vingroup' }
    ];
    
    const csvContent = [
      'symbol,name,description',
      ...sampleData.map(row => `${row.symbol},${row.name},${row.description}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_nhap_thong_tin_chung_khoan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Handle checkbox selection for single item
  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      // If already all selected, unselect all
      setSelectedItems(new Set());
    } else {
      // Select all visible items
      const allIds = filteredStockInfo
        .map(item => item.id)
        .filter(id => id !== undefined) as number[];
      setSelectedItems(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };
  
  // Clear all selections
  const clearSelections = () => {
    setSelectedItems(new Set());
    setSelectAll(false);
  };
  
  // Open multi-delete dialog
  const handleOpenMultiDeleteDialog = () => {
    if (selectedItems.size === 0) {
      setError('Vui lòng chọn ít nhất một mục để xóa');
      return;
    }
    setIsMultiDeleteDialogOpen(true);
  };
  
  // Delete multiple stock info items
  const handleDeleteMultipleStockInfo = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const selectedIds = Array.from(selectedItems) as number[];
      await Promise.all(selectedIds.map(id => deleteStockInfo(id)));
      
      setSuccess(`Đã xóa ${selectedIds.length} thông tin chứng khoán thành công`);
      setIsMultiDeleteDialogOpen(false);
      clearSelections();
      fetchStockInfo();
    } catch (error) {
      console.error('Lỗi khi xóa nhiều thông tin chứng khoán:', error);
      setError('Lỗi khi xóa thông tin chứng khoán');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Thông Tin Chứng Khoán</h1>
      
      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-2">
          <Input
            placeholder="Tìm kiếm theo mã hoặc tên chứng khoán..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div>
          <Select value={limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Số lượng hiển thị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 mục</SelectItem>
              <SelectItem value="20">20 mục</SelectItem>
              <SelectItem value="50">50 mục</SelectItem>
              <SelectItem value="100">100 mục</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
            Thêm Chứng Khoán
          </Button>
        </div>
      </div>
      
      {/* CRUD buttons */}
      <div className="flex justify-between space-x-2 mb-4">
        <div>
          {selectedItems.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleOpenMultiDeleteDialog}
            >
              Xóa ({selectedItems.size}) mục đã chọn
            </Button>
          )}
        </div>
        <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
          Nhập CSV
        </Button>
      </div>
      
      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Thông Tin Chứng Khoán</CardTitle>
          <CardDescription>
            Quản lý thông tin cơ bản về các mã chứng khoán
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeleton
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectAll && filteredStockInfo.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Chọn tất cả"
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => handleSort('symbol')}
                      >
                        Mã CK {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => handleSort('name')}
                      >
                        Tên Công Ty {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>
                        <div className="truncate max-w-[300px]">Mô Tả</div>
                      </TableHead>
                      <TableHead className="text-right">Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockInfo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStockInfo.map((info) => (
                        <TableRow key={info.id}>
                          <TableCell>
                            <Checkbox 
                              checked={info.id ? selectedItems.has(info.id) : false}
                              onCheckedChange={() => info.id !== undefined && handleSelectItem(info.id)}
                              aria-label={`Chọn ${info.symbol}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{info.symbol}</TableCell>
                          <TableCell>{info.name}</TableCell>
                          <TableCell>
                            <div className="truncate max-w-[300px]" title={info.description || ''}>
                              {info.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(info)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(info)}
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
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Thêm Thông Tin Chứng Khoán</DialogTitle>
            <DialogDescription>
              Nhập thông tin về mã chứng khoán mới.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Mã CK
              </Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="VHM"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên Công Ty
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Vinhomes"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô Tả
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Mô tả về công ty"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetFormData();
                setError(null);
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleCreateStockInfo} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Sửa Thông Tin Chứng Khoán</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin về mã chứng khoán.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Mã CK
              </Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên Công Ty
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô Tả
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetFormData();
                setError(null);
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleUpdateStockInfo} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu"}
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
              Bạn có chắc chắn muốn xóa thông tin chứng khoán "{selectedStockInfo?.symbol} - {selectedStockInfo?.name}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setError(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStockInfo}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Multi-Delete Dialog */}
      <AlertDialog open={isMultiDeleteDialogOpen} onOpenChange={setIsMultiDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhiều mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedItems.size} mục đã chọn không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setError(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMultipleStockInfo}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xóa tất cả đã chọn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nhập Dữ Liệu Từ CSV</DialogTitle>
            <DialogDescription>
              Chọn file CSV để nhập dữ liệu thông tin chứng khoán.
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csvFile">File CSV</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500">
                File CSV phải có các cột: symbol, name, description
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadSampleCSV}
                className="mt-2"
              >
                Tải file mẫu
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
                setError(null);
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleImportStockInfo} 
              disabled={isSubmitting || !importFile}
            >
              {isSubmitting ? "Đang xử lý..." : "Nhập Dữ Liệu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Notification */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          <div className="flex">
            <div>
              <p>{success}</p>
            </div>
            <button
              className="ml-auto"
              onClick={() => setSuccess(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
