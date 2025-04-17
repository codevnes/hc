'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { MediaItem } from '@/types/media';
import { fetchMedia, searchMedia, uploadMedia, updateMedia, deleteMedia } from '@/services/mediaService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Upload, Trash2, Edit, X, Image as ImageIcon } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// MediaItem interface is now imported from @/types/media

export default function MediaPage() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [metadata, setMetadata] = useState({
    title: '',
    alt_text: '',
    caption: ''
  });

  // Fetch media from API using service
  const loadMedia = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchMedia(token, currentPage);

      if (data.media) {
        setMedia(data.media);
        setTotalPages(Math.ceil((data.total || 0) / 12));
      } else {
        setMedia([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Không thể tải thư viện ảnh');
      setMedia([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch media when component mounts
  useEffect(() => {
    if (token) {
      loadMedia();
    }
  }, [token, loadMedia]);

  // Search media using service
  const handleSearch = async () => {
    if (!token || !searchQuery.trim()) return;

    try {
      setLoading(true);
      const data = await searchMedia(token, searchQuery);

      setMedia(data || []);
      setTotalPages(1); // Search results are not paginated
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching media:', error);
      toast.error('Lỗi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMetadata({
        title: file.name,
        alt_text: '',
        caption: ''
      });
    }
  };

  // Upload file using service
  const handleUpload = async () => {
    if (!token || !selectedFile) return;

    try {
      setUploading(true);

      await uploadMedia(token, selectedFile, metadata);

      toast.success('Tải lên thành công');
      setSelectedFile(null);
      setMetadata({ title: '', alt_text: '', caption: '' });
      setShowUploadDialog(false);
      loadMedia(); // Refresh the media list
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Không thể tải lên tệp');
    } finally {
      setUploading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setMetadata({
      title: item.title || '',
      alt_text: item.alt_text || '',
      caption: item.caption || ''
    });
    setShowEditDialog(true);
  };

  // Update media metadata using service
  const handleUpdateMedia = async () => {
    if (!token || !selectedMedia) return;

    try {
      setUploading(true);

      await updateMedia(token, selectedMedia.id, metadata);

      toast.success('Cập nhật thành công');
      setShowEditDialog(false);
      loadMedia(); // Refresh the media list
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setUploading(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setShowDeleteDialog(true);
  };

  // Delete media using service
  const handleDeleteMedia = async () => {
    if (!token || !selectedMedia) return;

    try {
      await deleteMedia(token, selectedMedia.id);

      toast.success('Xóa thành công');
      setShowDeleteDialog(false);
      loadMedia(); // Refresh the media list
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Không thể xóa tệp');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý thư viện ảnh</h1>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Tải lên ảnh mới
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm ảnh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4" />
        </Button>
        {searchQuery && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              loadMedia();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Không có ảnh nào</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Bắt đầu bằng cách tải lên ảnh đầu tiên của bạn.
          </p>
          <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Tải lên ảnh
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={`http://localhost:5000${item.filepath}`}
                    alt={item.alt_text || item.filename}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm truncate">{item.title || item.filename}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.size)} • {formatDate(item.created_at)}
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tải lên ảnh mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="relative w-40 h-40 mx-auto">
                    <Image
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Label htmlFor="file-upload" className="cursor-pointer text-primary">
                      Chọn tệp
                    </Label>{' '}
                    hoặc kéo thả vào đây
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt_text">Văn bản thay thế (Alt text)</Label>
                  <Input
                    id="alt_text"
                    value={metadata.alt_text}
                    onChange={(e) => setMetadata({ ...metadata, alt_text: e.target.value })}
                    placeholder="Mô tả ngắn về hình ảnh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Chú thích</Label>
                  <Textarea
                    id="caption"
                    value={metadata.caption}
                    onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                    placeholder="Chú thích cho hình ảnh (tùy chọn)"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                'Tải lên'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin ảnh</DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4 py-4">
              <div className="aspect-video relative rounded-md overflow-hidden">
                <Image
                  src={`http://localhost:5000${selectedMedia.filepath}`}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Tiêu đề</Label>
                  <Input
                    id="edit-title"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-alt-text">Văn bản thay thế (Alt text)</Label>
                  <Input
                    id="edit-alt-text"
                    value={metadata.alt_text}
                    onChange={(e) => setMetadata({ ...metadata, alt_text: e.target.value })}
                    placeholder="Mô tả ngắn về hình ảnh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-caption">Chú thích</Label>
                  <Textarea
                    id="edit-caption"
                    value={metadata.caption}
                    onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                    placeholder="Chú thích cho hình ảnh (tùy chọn)"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateMedia}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa ảnh này? Hành động này không thể hoàn tác.</p>

            {selectedMedia && (
              <div className="mt-4 aspect-video relative rounded-md overflow-hidden">
                <Image
                  src={`http://localhost:5000${selectedMedia.filepath}`}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMedia}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
