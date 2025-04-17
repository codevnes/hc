'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import toast, { Toaster } from 'react-hot-toast';

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  category_id: number;
  username: string;
  category_name: string;
  thumbnail: string | null;
  created_at: string;
  slug: string;
}

export default function PostsPage() {
  const { user, token, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token, isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // Fetch all posts or only user's posts based on role
      const endpoint = isAdmin ? `${apiUrl}/posts` : `${apiUrl}/posts/user/me`;

      const response = await axios.get(endpoint, {
        headers: { 'x-auth-token': token }
      });

      setPosts(response.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải bài viết:', err);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      await axios.delete(`${apiUrl}/posts/${postToDelete.id}`, {
        headers: { 'x-auth-token': token }
      });

      // Remove the deleted post from state
      setPosts(posts.filter(post => post.id !== postToDelete.id));
      toast.success('Xóa bài viết thành công');
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Lỗi khi xóa bài viết:', err);
      toast.error('Không thể xóa bài viết. Vui lòng thử lại sau.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    // Remove HTML tags properly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý bài viết</h1>
        <Button asChild>
          <Link href="/dashboard/posts/create" className="flex items-center">
            <FaPlus className="mr-2" /> Tạo bài viết mới
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Chưa có bài viết nào được tạo.</p>
            <Button asChild>
              <Link href="/dashboard/posts/create">
                <FaPlus className="mr-2" /> Tạo bài viết đầu tiên
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách bài viết</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  {isAdmin && <TableHead>Tác giả</TableHead>}
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{post.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {truncateContent(post.content)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.category_name}</Badge>
                    </TableCell>
                    {isAdmin && <TableCell>{post.username}</TableCell>}
                    <TableCell>{formatDate(post.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/post/${post.slug}`} target="_blank">
                            <FaEye className="mr-2 h-4 w-4" /> Xem
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/dashboard/posts/edit/${post.id}`}>
                            <FaEdit className="mr-2 h-4 w-4" /> Sửa
                          </Link>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => confirmDelete(post)}
                        >
                          <FaTrash className="mr-2 h-4 w-4" /> Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bài viết</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài viết "{postToDelete?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Xóa bài viết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
