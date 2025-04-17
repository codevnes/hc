'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Upload, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface MediaItem {
  id: number;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  alt_text: string;
  title: string;
  caption: string;
  created_at: string;
}

interface MediaLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export default function MediaLibrary({ open, onClose, onSelect }: MediaLibraryProps) {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState('library');
  const [metadata, setMetadata] = useState({
    title: '',
    alt_text: '',
    caption: ''
  });

  // Fetch media when dialog opens
  useEffect(() => {
    if (open && token) {
      fetchMedia();
    }
  }, [open, token]);

  // Fetch media from API
  const fetchMedia = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.API_URL}/media`, {
        headers: { 'x-auth-token': token }
      });
      setMedia(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Không thể tải thư viện ảnh');
    } finally {
      setLoading(false);
    }
  };

  // Search media
  const handleSearch = async () => {
    if (!token || !searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.API_URL}/media/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'x-auth-token': token }
      });
      setMedia(response.data);
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

  // Upload file
  const handleUpload = async () => {
    if (!token || !selectedFile) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', metadata.title);
      formData.append('alt_text', metadata.alt_text);
      formData.append('caption', metadata.caption);
      
      const response = await axios.post(`${process.env.API_URL}/media`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Tải lên thành công');
      setSelectedFile(null);
      setMetadata({ title: '', alt_text: '', caption: '' });
      setActiveTab('library');
      
      // Add the new media to the list
      setMedia([response.data, ...media]);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Không thể tải lên tệp');
    } finally {
      setUploading(false);
    }
  };

  // Handle media selection
  const handleMediaSelect = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  // Confirm selection
  const handleConfirmSelection = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Thư viện ảnh</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="library">Thư viện</TabsTrigger>
            <TabsTrigger value="upload">Tải lên</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center mb-4">
              <Input
                placeholder="Tìm kiếm ảnh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mr-2"
              />
              <Button onClick={handleSearch} variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có ảnh nào trong thư viện
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square border rounded-md overflow-hidden cursor-pointer transition-all ${
                        selectedMedia?.id === item.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleMediaSelect(item)}
                    >
                      <img
                        src={`http://localhost:5000${item.filepath}`}
                        alt={item.alt_text || item.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-white text-xs truncate w-full">
                          {item.title || item.filename}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="relative w-40 h-40 mx-auto">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
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
                  
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full"
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
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedMedia ? `Đã chọn: ${selectedMedia.title || selectedMedia.filename}` : 'Chưa chọn ảnh nào'}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedMedia}
              >
                Chọn
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
