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

interface Post {
  id: number;
  title: string;
  content: string;
  category_id: number;
  thumbnail: string | null;
  thumbnail_alt?: string;
  slug: string;
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

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
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
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
          headers: { 'x-auth-token': token }
        });
        
        setCategories(response.data);
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
        setError('Không thể tải danh mục. Vui lòng thử lại sau.');
      }
    };

    const fetchPost = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`, {
          headers: { 'x-auth-token': token }
        });
        
        const postData = response.data;
        setPost(postData);
        
        // Set form values
        form.setValue('title', postData.title);
        form.setValue('content', postData.content);
        form.setValue('category_id', String(postData.category_id));
        form.setValue('slug', postData.slug);
        
        // Set thumbnail preview if available
        if (postData.thumbnail) {
          setOriginalImageUrl(postData.thumbnail.startsWith('http') 
            ? postData.thumbnail 
            : `http://localhost:5000${postData.thumbnail}`);
          form.setValue('thumbnail', postData.thumbnail);
        }

        // Set thumbnail alt text if available
        if (postData.thumbnail_alt) {
          setThumbnailAltText(postData.thumbnail_alt);
        }
      } catch (err) {
        console.error('Lỗi khi tải bài viết:', err);
        setError('Không thể tải thông tin bài viết. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchCategories(), fetchPost()]).catch(err => {
      console.error('Lỗi khi khởi tạo trang:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      setLoading(false);
    });
  }, [token, params.id, form]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('title', e.target.value);
    
    // Auto-generate slug if not manually entered and if it matches the original slug pattern
    const currentSlug = form.getValues('slug');
    const currentTitle = e.target.value;
    
    // Only update slug automatically if it hasn't been manually edited
    if (post && currentSlug === post.slug) {
      const generatedSlug = currentTitle
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
      
      form.setValue('slug', generatedSlug);
    }
  };

  const handleImageChange = (fileOrUrl: File | string | null) => {
    form.setValue('thumbnail', fileOrUrl);
    
    if (fileOrUrl instanceof File) {
      // Tạo URL xem trước cho file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(fileOrUrl);
    } else if (typeof fileOrUrl === 'string') {
      // Nếu là URL từ thư viện, sử dụng trực tiếp
      setPreviewImage(fileOrUrl);
    } else {
      // Nếu là null, xoá xem trước
      setPreviewImage(null);
      setOriginalImageUrl(null);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!token || !post) return;
    
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
      } else {
        // Nếu xóa thumbnail
        formData.append('remove_thumbnail', 'true');
      }

      // Thêm alt text cho thumbnail nếu có
      if (thumbnailAltText) {
        formData.append('thumbnail_alt', thumbnailAltText);
      }
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`,
        formData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('Cập nhật bài viết thành công');
      router.push('/dashboard/posts');
    } catch (err) {
      console.error('Lỗi khi cập nhật bài viết:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Không thể cập nhật bài viết. Vui lòng thử lại sau.');
      }
      toast.error('Không thể cập nhật bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Chỉnh sửa bài viết</h1>
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
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="ten-bai-viet"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Slug sẽ được sử dụng trong URL.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category_id">Danh mục</Label>
                <Select
                  disabled={loading || submitting}
                  onValueChange={(value) => form.setValue('category_id', value)}
                  value={form.getValues('category_id')}
                  defaultValue={form.getValues('category_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.category_id.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <ImageSelector 
                  label="Ảnh đại diện (tùy chọn)"
                  value={previewImage || originalImageUrl || null}
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
                    Đang lưu...
                  </>
                ) : (
                  'Cập nhật bài viết'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
} 