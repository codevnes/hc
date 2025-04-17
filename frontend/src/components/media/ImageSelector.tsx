'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, UploadCloud, X } from 'lucide-react';
import { MediaBrowser } from './MediaBrowser';

interface ImageSelectorProps {
  value?: File | string | null;
  onChange: (value: File | string | null) => void;
  onAltTextChange?: (value: string) => void;
  altText?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export function ImageSelector({
  value,
  onChange,
  onAltTextChange,
  altText = '',
  label = 'Ảnh',
  helperText,
  disabled = false
}: ImageSelectorProps) {
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    // Nếu value là string (URL), sử dụng nó làm preview
    if (typeof value === 'string') {
      return value.startsWith('http') ? value : `http://localhost:5000${value}`;
    }
    return null;
  });

  // Xử lý khi tải tệp lên từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      
      // Tạo URL xem trước
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Xử lý khi chọn ảnh từ thư viện
  const handleMediaSelect = (media: { id: number; url: string; title: string; alt: string }) => {
    onChange(media.url);
    setPreviewUrl(media.url);
    
    // Cập nhật alt text nếu được cung cấp
    if (onAltTextChange && media.alt) {
      onAltTextChange(media.alt);
    }
  };

  // Xóa ảnh đã chọn
  const handleClearImage = () => {
    onChange(null);
    setPreviewUrl(null);
    
    if (onAltTextChange) {
      onAltTextChange('');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex flex-col space-y-4">
        {/* Hiển thị xem trước ảnh nếu đã chọn */}
        {previewUrl && (
          <div className="relative">
            <div className="border rounded-md overflow-hidden bg-muted max-w-[300px]">
              <img src={previewUrl} alt={altText || 'Xem trước'} className="max-w-full h-auto" />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleClearImage}
              disabled={disabled}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Hiển thị input hoặc buttons nếu chưa chọn hoặc đã chọn */}
        {!previewUrl ? (
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="max-w-[400px]"
            />
            <div className="text-xs text-muted-foreground">{helperText}</div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <div className="text-sm font-medium">hoặc</div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMediaBrowserOpen(true)}
                disabled={disabled}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Chọn từ thư viện</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMediaBrowserOpen(true)}
              disabled={disabled}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Chọn ảnh khác</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => handleFileChange(e as any);
                fileInput.click();
              }}
              disabled={disabled}
              className="gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Tải lên ảnh mới</span>
            </Button>
          </div>
        )}
        
        {/* Input cho alt text nếu cần */}
        {onAltTextChange && (
          <div className="space-y-2 max-w-[400px]">
            <Label htmlFor="alt-text">Văn bản thay thế (Alt text)</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => onAltTextChange(e.target.value)}
              placeholder="Mô tả ngắn về hình ảnh"
              disabled={disabled}
            />
            <div className="text-xs text-muted-foreground">
              Giúp người dùng hiểu nội dung hình ảnh khi không thể xem được
            </div>
          </div>
        )}
      </div>
      
      {/* Dialog chọn ảnh từ thư viện */}
      <MediaBrowser
        open={mediaBrowserOpen}
        onClose={() => setMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
} 