'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaFileUpload, FaFileDownload, FaCalendarAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllStockAssets,
  deleteStockAssetsById,
  deleteMultipleStockAssetsByIds,
  importStockAssetsFromCSV,
  getStockAssetsByDateRange
} from '@/services/stockAssetsService';
import { StockAssets } from '@/services/stockDataTypes';
import { useAuth } from '@/context/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function StockAssetsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [stockAssetsData, setStockAssetsData] = useState<StockAssets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch stock assets data
  const fetchStockAssetsData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (startDate && endDate) {
        // If date range is provided, use date range API
        data = await getStockAssetsByDateRange(startDate, endDate, search || undefined);
        if (Array.isArray(data)) {
          setStockAssetsData(data);
          setTotalItems(data.length);
          setTotalPages(Math.ceil(data.length / limit));
        } else {
          console.error('Unexpected response format for date range:', data);
          setStockAssetsData([]);
          setTotalItems(0);
          setTotalPages(1);
          setError('Định dạng dữ liệu không hợp lệ');
        }
      } else {
        // Otherwise use pagination API
        const offset = (currentPage - 1) * limit;
        data = await getAllStockAssets(limit, offset);

        // Handle different response formats
        if (Array.isArray(data)) {
          // If the API returns an array directly
          setStockAssetsData(data);
          setTotalItems(data.length); // We don't have total count, so use array length
          setTotalPages(Math.ceil(data.length / limit));
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.data)) {
            // If the API returns {data: [...], total: number}
            setStockAssetsData(data.data);
            setTotalItems(data.total || data.data.length);
            setTotalPages(Math.ceil((data.total || data.data.length) / limit));
          } else {
            // Unknown object format
            console.error('Unexpected response object format:', data);
            setStockAssetsData([]);
            setTotalItems(0);
            setTotalPages(1);
            setError('Định dạng dữ liệu không hợp lệ');
          }
        } else {
          // Completely unexpected format
          console.error('Unexpected response format:', data);
          setStockAssetsData([]);
          setTotalItems(0);
          setTotalPages(1);
          setError('Định dạng dữ liệu không hợp lệ');
        }
      }
    } catch (err) {
      console.error('Error fetching stock assets data:', err);
      setStockAssetsData([]);
      setError('Không thể tải dữ liệu tài sản chứng khoán');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStockAssetsData();
  }, [currentPage, limit, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchStockAssetsData();
  };

  // Handle date range search
  const handleDateRangeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchStockAssetsData();
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
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <FaSort className="ml-1 h-3 w-3 text-muted-foreground" />;
    return sortOrder === 'asc' ?
      <FaSortUp className="ml-1 h-3 w-3 text-primary" /> :
      <FaSortDown className="ml-1 h-3 w-3 text-primary" />;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!assetToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteStockAssetsById(assetToDelete);
      fetchStockAssetsData(); // Refresh the list
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (err) {
      console.error('Error deleting stock assets data:', err);
      setError('Không thể xóa dữ liệu tài sản');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle multiple delete
  const handleMultipleDelete = async () => {
    if (selectedItems.length === 0) return;

    setDeleteLoading(true);
    try {
      await deleteMultipleStockAssetsByIds(selectedItems);
      fetchStockAssetsData(); // Refresh the list
      setSelectedItems([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting multiple stock assets data:', err);
      setError('Không thể xóa dữ liệu tài sản');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (asset: StockAssets) => {
    if (!asset.id) {
      setError('Không thể xóa mục này vì thiếu ID');
      return;
    }
    setAssetToDelete(asset.id);
    setDeleteDialogOpen(true);
  };

  // Handle CSV import
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileInputRef.current?.files?.length) {
      return;
    }

    const file = fileInputRef.current.files[0];
    setImportLoading(true);
    setImportResult(null);

    try {
      const result = await importStockAssetsFromCSV(file);
      setImportResult(result);

      // Refresh the list after successful import
      if (result.importedCount > 0) {
        fetchStockAssetsData();
      }
    } catch (err: any) {
      console.error('Error importing CSV:', err);
      setImportResult({
        error: true,
        message: err.response?.data?.message || 'Không thể import file CSV'
      });
    } finally {
      setImportLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = 'symbol,date,tts,vcsh,tb_tts_nganh\nVIC,2023-01-01,100000,50000,80000\nVNM,2023-01-01,80000,40000,60000';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_assets_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle checkbox selection
  const handleSelectItem = (id: number | undefined, checked: boolean) => {
    if (!id) return;

    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && stockAssetsData) {
      const allIds = stockAssetsData
        .filter(item => item.id !== undefined)
        .map(item => item.id as number);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format number for display
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return '-';
    }
    return Number(value).toLocaleString('vi-VN');
  };

  // Pagination controls
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Tài sản Chứng khoán</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FaFileUpload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button asChild>
              <Link href="/dashboard/stock-assets/create">
                <FaPlus className="mr-2 h-4 w-4" />
                Thêm dữ liệu mới
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách dữ liệu tài sản</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo mã chứng khoán..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Tìm kiếm</Button>
            </form>

            <form onSubmit={handleDateRangeSearch} className="flex gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="relative">
                  <FaCalendarAlt className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="Từ ngày"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="Đến ngày"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit">Lọc</Button>
            </form>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Selected items actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between bg-muted p-2 rounded-md mb-4">
              <span className="text-sm">{selectedItems.length} mục đã chọn</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <FaTrash className="mr-2 h-4 w-4" />
                Xóa đã chọn
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedItems.length > 0 && stockAssetsData && selectedItems.length === stockAssetsData.filter(item => item.id !== undefined).length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('symbol')}
                      className="flex items-center font-medium"
                    >
                      Mã CK {getSortIcon('symbol')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center font-medium"
                    >
                      Ngày {getSortIcon('date')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort('tts')}
                      className="flex items-center font-medium justify-end w-full"
                    >
                      Tổng tài sản {getSortIcon('tts')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    <button
                      onClick={() => handleSort('vcsh')}
                      className="flex items-center font-medium justify-end w-full"
                    >
                      Vốn chủ sở hữu {getSortIcon('vcsh')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('tb_tts_nganh')}
                      className="flex items-center font-medium justify-end w-full"
                    >
                      TB TTS ngành {getSortIcon('tb_tts_nganh')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
                    </TableCell>
                  </TableRow>
                ) : !stockAssetsData || stockAssetsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="text-muted-foreground">Không có dữ liệu</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  stockAssetsData.map((asset) => (
                    <TableRow key={`${asset.id || `${asset.symbol}-${asset.date}`}`}>
                      <TableCell>
                        {asset.id && (
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(asset.id)}
                            onChange={(e) => handleSelectItem(asset.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-bold">{asset.symbol}</TableCell>
                      <TableCell>{formatDate(asset.date)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(asset.tts)}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {formatNumber(asset.vcsh)}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {formatNumber(asset.tb_tts_nganh)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={asset.id ? `/dashboard/stock-assets/edit/${asset.id}` : `/dashboard/stock-assets/edit/${asset.symbol}/${asset.date}`}>
                              <FaEdit className="h-4 w-4" />
                              <span className="sr-only">Sửa</span>
                            </Link>
                          </Button>
                          {isAdmin && asset.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(asset)}
                            >
                              <FaTrash className="h-4 w-4" />
                              <span className="sr-only">Xóa</span>
                            </Button>
                          )}
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
            <div className="text-sm text-muted-foreground">
              Hiển thị {stockAssetsData ? stockAssetsData.length : 0} / {totalItems} mục
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                Trước
              </Button>
              <span className="text-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItems.length > 0 ? (
                <>
                  Bạn có chắc chắn muốn xóa <strong>{selectedItems.length}</strong> mục đã chọn?
                </>
              ) : assetToDelete ? (
                <>
                  Bạn có chắc chắn muốn xóa dữ liệu tài sản này?
                </>
              ) : null}
              <br />
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={selectedItems.length > 0 ? handleMultipleDelete : handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Import dữ liệu từ CSV</AlertDialogTitle>
            <AlertDialogDescription>
              Tải lên file CSV chứa dữ liệu tài sản chứng khoán. File CSV phải có các cột: symbol, date, tts, vcsh, tb_tts_nganh.
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={downloadCSVTemplate} className="w-full">
                  <FaFileDownload className="mr-2 h-4 w-4" />
                  Tải mẫu CSV
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleImportCSV}>
            <div className="py-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                required
                disabled={importLoading}
              />

              {importResult && (
                <div className={`mt-4 p-3 rounded-md ${importResult.error ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800'}`}>
                  {importResult.error ? (
                    <p>{importResult.message}</p>
                  ) : (
                    <div>
                      <p className="font-medium">Kết quả import:</p>
                      <ul className="mt-1 list-disc list-inside text-sm">
                        <li>Tổng số bản ghi: {importResult.totalCount || importResult.importedCount}</li>
                        <li>Thành công: {importResult.importedCount}</li>
                        {importResult.errorCount && <li>Lỗi: {importResult.errorCount}</li>}
                      </ul>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">Xem chi tiết lỗi ({importResult.errors.length})</summary>
                          <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                            <ul className="list-disc list-inside">
                              {importResult.errors.map((err: any, index: number) => (
                                <li key={index}>
                                  {err.symbol && err.date ? `${err.symbol} (${err.date}): ${err.error}` : `Dòng ${err.row}: ${err.error}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={importLoading}>Hủy</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="submit" disabled={importLoading}>
                  {importLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}