'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ImageSelector } from '@/components/media/ImageSelector';

interface Category {
  id: number;
  name: string;
  description: string;
}

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
  category_id: z.string().refine(val => Number(val) > 0, {
    message: 'Vui lòng chọn danh mục'
  }),
  slug: z.string().optional(),
  thumbnail: z.union([z.instanceof(File), z.string(), z.null()]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailAltText, setThumbnailAltText] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      category_id: '',
      slug: '',
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await axios.get(`${apiUrl}/categories`, {
          headers: { 'x-auth-token': token }
        });

        setCategories(response.data);
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
        setError('Không thể tải danh mục. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);

    // Auto-generate slug if not manually entered or if slug field is empty
    const currentSlug = form.getValues('slug');
    if (!currentSlug || currentSlug === '') {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      // Update the slug field
      form.setValue('slug', generatedSlug, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  };

  const handleImageChange = (fileOrUrl: File | string | null) => {
    form.setValue('thumbnail', fileOrUrl);
  };

  const onSubmit = async (data: FormValues) => {
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('category_id', String(data.category_id));

      if (data.slug) {
        formData.append('slug', data.slug);
      }

      // Xử lý thumbnail khác nhau dựa trên loại dữ liệu
      if (data.thumbnail) {
        if (data.thumbnail instanceof File) {
          formData.append('thumbnail', data.thumbnail);
        } else if (typeof data.thumbnail === 'string') {
          formData.append('thumbnail_url', data.thumbnail);
        }
      }

      // Thêm alt text cho thumbnail nếu có
      if (thumbnailAltText) {
        formData.append('thumbnail_alt', thumbnailAltText);
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts`,
        formData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Tạo bài viết thành công');
      router.push('/dashboard/posts');
    } catch (err) {
      console.error('Lỗi khi tạo bài viết:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Không thể tạo bài viết. Vui lòng thử lại sau.');
      }
      toast.error('Không thể tạo bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tạo bài viết mới</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/posts')}
        >
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  onChange={handleTitleChange}
                  placeholder="Nhập tiêu đề bài viết"
                  disabled={submitting}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug URL (tùy chọn)</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="ten-bai-viet"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Để trống để tự động tạo từ tiêu đề. Slug sẽ được sử dụng trong URL.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category_id">Danh mục</Label>
                <Select
                  disabled={loading || submitting}
                  onValueChange={(value) => form.setValue('category_id', value)}
                  defaultValue={form.getValues('category_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Đang tải...</span>
                      </div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.category_id.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <ImageSelector
                  label="Ảnh đại diện (tùy chọn)"
                  value={form.getValues('thumbnail')}
                  onChange={handleImageChange}
                  onAltTextChange={setThumbnailAltText}
                  altText={thumbnailAltText}
                  helperText="Chọn ảnh đại diện cho bài viết. Chấp nhận các định dạng JPG, PNG, GIF, WEBP."
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Nội dung</Label>
                <RichTextEditor
                  value={form.getValues('content')}
                  onChange={(value) => form.setValue('content', value, {
                    shouldValidate: true,
                    shouldDirty: true
                  })}
                  placeholder="Nhập nội dung bài viết..."
                  disabled={submitting}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng bài viết'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}