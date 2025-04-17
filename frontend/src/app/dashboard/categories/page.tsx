'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function CategoriesPage() {
  const { token, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.API_URL}/categories`, {
          headers: { 'x-auth-token': token }
        });
        setCategories(response.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
        setError('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token, isAdmin, router]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    try {
      await axios.delete(`${process.env.API_URL}/categories/${id}`, {
        headers: { 'x-auth-token': token }
      });

      toast.success('Đã xóa danh mục thành công');
      setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa danh mục:', err);
      toast.error('Không thể xóa danh mục. Vui lòng thử lại sau.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate slug from name if the user hasn't manually edited it
    if (name === 'name' && (!formData.slug || formData.slug === convertToSlug(formData.name))) {
      setFormData(prev => ({ ...prev, slug: convertToSlug(value) }));
    }
  };

  const convertToSlug = (text: string) => {
    return text.toLowerCase()
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
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setFormData({ name: '', slug: '', description: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setIsEditMode(true);
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Tên danh mục không được để trống');
      return;
    }

    try {
      const apiUrl = process.env.API_URL;
      
      if (isEditMode && currentCategory) {
        // Update existing category
        const response = await axios.put(
          `${process.env.API_URL}/categories/${currentCategory.id}`,
          formData,
          { headers: { 'x-auth-token': token } }
        );
        
        setCategories(categories.map(cat => 
          cat.id === currentCategory.id ? { ...response.data, id: currentCategory.id } : cat
        ));
        
        toast.success('Đã cập nhật danh mục thành công');
      } else {
        // Create new category
        const response = await axios.post(
          `${apiUrl}/categories`,
          formData,
          { headers: { 'x-auth-token': token } }
        );
        
        setCategories([...categories, response.data]);
        toast.success('Đã tạo danh mục mới thành công');
      }
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      toast.error('Không thể lưu danh mục. Vui lòng thử lại sau.');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý danh mục</h1>
        <Button onClick={openCreateDialog} className="flex items-center">
          <FaPlus className="mr-2" /> Thêm danh mục mới
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Card className="w-full h-16 animate-pulse bg-muted" />
          <Card className="w-full h-16 animate-pulse bg-muted" />
          <Card className="w-full h-16 animate-pulse bg-muted" />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Chưa có danh mục nào được tạo.</p>
            <Button onClick={openCreateDialog} variant="default">
              <FaPlus className="mr-2" /> Tạo danh mục đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">Slug: {category.slug}</p>
                  {category.description && (
                    <p className="text-sm mt-1 line-clamp-1">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                    <FaEdit className="mr-2" /> Sửa
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                    <FaTrash className="mr-2" /> Xóa
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên danh mục</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên danh mục"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="ten-danh-muc"
                />
                <p className="text-xs text-muted-foreground">
                  Slug sẽ được dùng trong URL. Để trống để tự động tạo từ tên.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả cho danh mục (tùy chọn)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">
                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
