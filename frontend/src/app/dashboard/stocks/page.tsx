'use client';

import React, { useEffect, useState } from 'react';
import { FaPlus, FaSearch, FaFileImport, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import {
  getAllStocks,
  createStock,
  updateStockById,
  deleteStockById,
  deleteMultipleStocksByIds,
  importStocksFromCSV,
  Stock
} from '@/services/stockService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Schema cho form thêm/sửa cổ phiếu
const stockFormSchema = z.object({
  symbol: z.string().min(1, 'Symbol là bắt buộc'),
  date: z.string().min(1, 'Ngày là bắt buộc'),
  open: z.coerce.number().optional(),
  high: z.coerce.number().optional(),
  low: z.coerce.number().optional(),
  close: z.coerce.number().optional(),
  band_dow: z.coerce.number().optional(),
  band_up: z.coerce.number().optional(),
  trend_q: z.coerce.number().optional(),
  fq: z.coerce.number().optional(),
  qv1: z.coerce.number().optional(),
});

export default function StocksPage() {
  const { token } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStocks, setTotalStocks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form sử dụng react-hook-form với zod validation
  const form = useForm<z.infer<typeof stockFormSchema>>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      symbol: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      open: undefined,
      high: undefined,
      low: undefined,
      close: undefined,
      band_dow: undefined,
      band_up: undefined,
      trend_q: undefined,
      fq: undefined,
      qv1: undefined,
    },
  });

  useEffect(() => {
    if (token) {
      fetchStocks();
    }
  }, [token, currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (editingStock) {
      form.reset({
        symbol: editingStock.symbol,
        date: editingStock.date ? editingStock.date.split('T')[0] : '',
        open: editingStock.open !== null && editingStock.open !== undefined ? Number(editingStock.open) : undefined,
        high: editingStock.high !== null && editingStock.high !== undefined ? Number(editingStock.high) : undefined,
        low: editingStock.low !== null && editingStock.low !== undefined ? Number(editingStock.low) : undefined,
        close: editingStock.close !== null && editingStock.close !== undefined ? Number(editingStock.close) : undefined,
        band_dow: editingStock.band_dow !== null && editingStock.band_dow !== undefined ? Number(editingStock.band_dow) : undefined,
        band_up: editingStock.band_up !== null && editingStock.band_up !== undefined ? Number(editingStock.band_up) : undefined,
        trend_q: editingStock.trend_q !== null && editingStock.trend_q !== undefined ? Number(editingStock.trend_q) : undefined,
        fq: editingStock.fq !== null && editingStock.fq !== undefined ? Number(editingStock.fq) : undefined,
        qv1: editingStock.qv1 !== null && editingStock.qv1 !== undefined ? Number(editingStock.qv1) : undefined,
      });
    }
  }, [editingStock, form]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API để lấy danh sách cổ phiếu có phân trang
      const result = await getAllStocks(currentPage, itemsPerPage);
      
      setStocks(result.data);
      setTotalStocks(result.totalCount);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách cổ phiếu:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchStocks();
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleCheckboxChange = (id: number | undefined) => {
    if (!id) return;
    
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = stocks
        .filter(stock => stock.id !== undefined)
        .map(stock => stock.id as number);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleAddNew = () => {
    setEditingStock(null);
    form.reset({
      symbol: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      open: undefined,
      high: undefined,
      low: undefined,
      close: undefined,
      band_dow: undefined,
      band_up: undefined,
      trend_q: undefined,
      fq: undefined,
      qv1: undefined,
    });
    setOpenEditDialog(true);
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setOpenEditDialog(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedIds.length === 0) return;
      
      if (selectedIds.length === 1) {
        await deleteStockById(selectedIds[0]);
      } else {
        await deleteMultipleStocksByIds(selectedIds);
      }
      
      toast.success(`Đã xóa ${selectedIds.length} mục thành công`);
      setSelectedIds([]);
      setOpenDeleteDialog(false);
      fetchStocks();
    } catch (err) {
      console.error('Lỗi khi xóa cổ phiếu:', err);
      toast.error('Không thể xóa. Vui lòng thử lại sau.');
    }
  };

  const onSubmit = async (data: z.infer<typeof stockFormSchema>) => {
    try {
      if (editingStock?.id) {
        // Cập nhật cổ phiếu
        await updateStockById(editingStock.id, data);
        toast.success('Cập nhật thành công');
      } else {
        // Thêm cổ phiếu mới
        await createStock(data);
        toast.success('Thêm mới thành công');
      }
      
      setOpenEditDialog(false);
      fetchStocks();
    } catch (err) {
      console.error('Lỗi khi lưu cổ phiếu:', err);
      toast.error('Không thể lưu dữ liệu. Vui lòng thử lại sau.');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await importStocksFromCSV(file);
      toast.success('Nhập dữ liệu thành công');
      fetchStocks();
    } catch (err) {
      console.error('Lỗi khi nhập dữ liệu:', err);
      toast.error('Không thể nhập dữ liệu. Vui lòng kiểm tra định dạng file.');
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const totalPages = Math.ceil(totalStocks / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý QIndex</h1>
        <div className="space-x-2">
          <Button onClick={handleAddNew}>
            <FaPlus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
          <label htmlFor="import-csv">
            <Button asChild>
              <div>
                <FaFileImport className="mr-2 h-4 w-4" />
                Nhập CSV
                <input
                  id="import-csv"
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </div>
            </Button>
          </label>
          <Button
            variant="destructive"
            disabled={selectedIds.length === 0}
            onClick={() => setOpenDeleteDialog(true)}
          >
            <FaTrash className="mr-2 h-4 w-4" />
            Xóa ({selectedIds.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Danh sách QIndex</CardTitle>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Tìm theo mã cổ phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit">
              <FaSearch className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
            {searchTerm && (
              <Button type="button" variant="outline" onClick={handleResetSearch}>
                Xóa bộ lọc
              </Button>
            )}
          </form>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === stocks.length && stocks.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-28">Mã CK</TableHead>
                  <TableHead className="w-28">Ngày</TableHead>
                  <TableHead className="w-20">Mở cửa</TableHead>
                  <TableHead className="w-20">Cao nhất</TableHead>
                  <TableHead className="w-20">Thấp nhất</TableHead>
                  <TableHead className="w-20">Đóng cửa</TableHead>
                  <TableHead className="w-20">Band Dưới</TableHead>
                  <TableHead className="w-20">Band Trên</TableHead>
                  <TableHead className="w-20">Trend Q</TableHead>
                  <TableHead className="w-20">FQ</TableHead>
                  <TableHead className="w-20">QV1</TableHead>
                  <TableHead className="w-20 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={12}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : stocks.length > 0 ? (
                  stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell>
                        <Checkbox
                          checked={stock.id ? selectedIds.includes(stock.id) : false}
                          onCheckedChange={() => handleCheckboxChange(stock.id)}
                          aria-label={`Select ${stock.symbol}`}
                        />
                      </TableCell>
                      <TableCell>{stock.symbol}</TableCell>
                      <TableCell>
                        {stock.date ? format(new Date(stock.date), 'dd/MM/yyyy', { locale: vi }) : ''}
                      </TableCell>
                      <TableCell>{isNaN(Number(stock.open)) ? '-' : Number(stock.open).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.high)) ? '-' : Number(stock.high).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.low)) ? '-' : Number(stock.low).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.close)) ? '-' : Number(stock.close).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.band_dow)) ? '-' : Number(stock.band_dow).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.band_up)) ? '-' : Number(stock.band_up).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.trend_q)) ? '-' : Number(stock.trend_q).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.fq)) ? '-' : Number(stock.fq).toFixed(2)}</TableCell>
                      <TableCell>{isNaN(Number(stock.qv1)) ? '-' : Number(stock.qv1)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(stock)}
                          aria-label={`Sửa ${stock.symbol}`}
                        >
                          <FaEdit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages} ({totalStocks} mục)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.max(1, currentPage - 1));
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    let pageNumber: number;
                    
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                      if (idx === 4) return (
                        <PaginationItem key={idx}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
                      if (idx === 0) return (
                        <PaginationItem key={idx}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      if (idx === 0) return (
                        <PaginationItem key={idx}>
                          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                        </PaginationItem>
                      );
                      if (idx === 1) return (
                        <PaginationItem key={idx}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (idx === 3) return (
                        <PaginationItem key={idx}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (idx === 4) return (
                        <PaginationItem key={idx}>
                          <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                        </PaginationItem>
                      );
                      pageNumber = currentPage;
                    }
                    
                    return (
                      <PaginationItem key={idx}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={pageNumber === currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.min(totalPages, currentPage + 1));
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog thêm/sửa cổ phiếu */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStock ? 'Sửa QIndex' : 'Thêm QIndex mới'}</DialogTitle>
            <DialogDescription>
              Nhập thông tin chỉ số cổ phiếu bên dưới.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã CK</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="VN30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="open"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá mở cửa</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="close"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá đóng cửa</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="high"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá cao nhất</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="low"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá thấp nhất</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="band_dow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Band Dưới</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="band_up"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Band Trên</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trend_q"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trend Q</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fq"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FQ</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="qv1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QV1</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingStock ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedIds.length} mục đã chọn? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
