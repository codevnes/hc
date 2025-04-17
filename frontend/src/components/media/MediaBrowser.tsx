'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MediaItem {
  id: number;
  title: string;
  alt_text: string;
  filepath: string;
  created_at: string;
}

interface MediaBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { id: number; url: string; title: string; alt: string }) => void;
}

export function MediaBrowser({ open, onClose, onSelect }: MediaBrowserProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Tải danh sách ảnh
  const fetchMedia = async (page = 1, search = '') => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      
      let url = `http://localhost:5000/api/media/editor/images?limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách ảnh');
      }

      const data = await response.json();
      setMediaItems(data.items.map((item: any) => ({
        id: parseInt(item.value),
        title: item.title,
        alt_text: item.alt,
        filepath: item.url,
        created_at: item.createdAt
      })));
      setTotalItems(data.total);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ảnh:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải lại khi dialog mở
  useEffect(() => {
    if (open) {
      fetchMedia(page, searchQuery);
    }
  }, [open, page, token]);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    setPage(1);
    fetchMedia(1, searchQuery);
  };

  // Xử lý khi chọn ảnh
  const handleSelectImage = () => {
    if (!selectedItem) return;
    
    const selected = mediaItems.find(item => item.id === selectedItem);
    if (!selected) return;
    
    onSelect({
      id: selected.id,
      url: selected.filepath,
      title: selected.title,
      alt: selected.alt_text
    });
    
    onClose();
  };

  // Tính số trang
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn ảnh từ thư viện</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-2">
          <Input
            placeholder="Tìm kiếm ảnh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={() => fetchMedia(page, searchQuery)} className="mt-2">
                Thử lại
              </Button>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p>Không có ảnh nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 py-2">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-md p-2 cursor-pointer transition-all ${
                    selectedItem === item.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedItem(item.id)}
                >
                  <div className="aspect-video w-full overflow-hidden bg-muted rounded-sm mb-2">
                    <img 
                      src={item.filepath}
                      alt={item.alt_text || item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm truncate">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!isLoading && mediaItems.length > 0 && (
          <div className="flex items-center justify-between py-2 border-t">
            <div className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSelectImage} disabled={!selectedItem || isLoading}>
            Chọn ảnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 