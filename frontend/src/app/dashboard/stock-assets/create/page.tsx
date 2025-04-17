'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createStockAssets } from '@/services/stockAssetsService';
import { getAllStockInfo, StockInfo } from '@/services/stockInfoService';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation schema
const stockAssetsSchema = z.object({
  symbol: z.string().min(1, 'Mã chứng khoán không được để trống'),
  date: z.string().min(1, 'Ngày không được để trống'),
  tts: z.coerce.number().optional(),
  vcsh: z.coerce.number().optional(),
  tb_tts_nganh: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof stockAssetsSchema>;

export default function CreateStockAssetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockInfos, setStockInfos] = useState<StockInfo[]>([]);
  const [stockInfoLoading, setStockInfoLoading] = useState(true);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(stockAssetsSchema),
    defaultValues: {
      symbol: '',
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      tts: undefined,
      vcsh: undefined,
      tb_tts_nganh: undefined,
    },
  });

  // Fetch stock info for dropdown
  useEffect(() => {
    const fetchStockInfos = async () => {
      setStockInfoLoading(true);
      try {
        const response = await getAllStockInfo(1, 1000); // Get all stock info for dropdown
        setStockInfos(response.data);
      } catch (err) {
        console.error('Error fetching stock info:', err);
        setError('Không thể tải danh sách mã chứng khoán');
      } finally {
        setStockInfoLoading(false);
      }
    };

    fetchStockInfos();
  }, []);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);

    try {
      await createStockAssets(data);
      router.push('/dashboard/stock-assets');
    } catch (err: any) {
      console.error('Error creating stock assets data:', err);
      setError(
        err.response?.data?.message || 
        'Không thể tạo dữ liệu tài sản. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Thêm Dữ Liệu Tài Sản Mới</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài sản</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã chứng khoán</FormLabel>
                      <Select
                        disabled={loading || stockInfoLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mã chứng khoán" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockInfoLoading ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Đang tải...</span>
                            </div>
                          ) : (
                            stockInfos.map((stock) => (
                              <SelectItem key={stock.symbol} value={stock.symbol}>
                                {stock.symbol} - {stock.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                        <Input 
                          type="date"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="tts"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Tổng tài sản</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          value={value === undefined ? '' : value}
                          onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vcsh"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Vốn chủ sở hữu</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          value={value === undefined ? '' : value}
                          onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tb_tts_nganh"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>TB TTS ngành</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          value={value === undefined ? '' : value}
                          onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
