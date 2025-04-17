'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStockAssetsById, updateStockAssetsById } from '@/services/stockAssetsService';
import { StockAssets } from '@/services/stockDataTypes';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Validation schema
const stockAssetsSchema = z.object({
  symbol: z.string().min(1, 'Mã chứng khoán không được để trống'),
  date: z.string().min(1, 'Ngày không được để trống'),
  tts: z.coerce.number().optional(),
  vcsh: z.coerce.number().optional(),
  tb_tts_nganh: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof stockAssetsSchema>;

export default function EditStockAssetsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockAssets, setStockAssets] = useState<StockAssets | null>(null);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(stockAssetsSchema),
    defaultValues: {
      symbol: '',
      date: '',
      tts: undefined,
      vcsh: undefined,
      tb_tts_nganh: undefined,
    },
  });

  // Fetch stock assets data
  useEffect(() => {
    const fetchStockAssets = async () => {
      setFetchLoading(true);
      setError(null);
      try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
          throw new Error('ID không hợp lệ');
        }
        
        const data = await getStockAssetsById(id);
        setStockAssets(data);
        
        // Set form values
        form.reset({
          symbol: data.symbol,
          date: data.date,
          tts: data.tts,
          vcsh: data.vcsh,
          tb_tts_nganh: data.tb_tts_nganh,
        });
      } catch (err) {
        console.error('Error fetching stock assets data:', err);
        setError('Không thể tải thông tin dữ liệu tài sản');
      } finally {
        setFetchLoading(false);
      }
    };

    if (params.id) {
      fetchStockAssets();
    }
  }, [params.id, form]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!stockAssets || !stockAssets.id) return;
    
    setLoading(true);
    setError(null);

    try {
      await updateStockAssetsById(stockAssets.id, data);
      router.push('/dashboard/stock-assets');
    } catch (err: any) {
      console.error('Error updating stock assets data:', err);
      setError(
        err.response?.data?.message || 
        'Không thể cập nhật dữ liệu tài sản. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  if (error && !stockAssets) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Lỗi</h2>
        <p>{error}</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mt-4"
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chỉnh Sửa Dữ Liệu Tài Sản</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {stockAssets?.symbol} - Ngày {new Date(stockAssets?.date || '').toLocaleDateString('vi-VN')}
          </CardTitle>
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
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled
                        />
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
                        <Input 
                          type="date"
                          {...field} 
                          disabled
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
