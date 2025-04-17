'use client';

import { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { uploadEditorImage } from '@/services/editorService';
import { MediaBrowser } from '@/components/media/MediaBrowser';

// Define TinyMCE editor type
type TinyMCEEditor = {
  windowManager: {
    open: (config: any) => any;
  };
  notificationManager: {
    open: (config: { text: string; type: string }) => void;
  };
  on: (event: string, callback: (e: any) => void) => void;
  selection?: {
    getBookmark: (level?: number, normalized?: boolean) => any;
    moveToBookmark: (bookmark: any) => void;
  };
};

interface ClassicEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onError?: () => void;
  height?: number;
}

export default function ClassicEditor({
  initialValue = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  onError,
  height = 500
}: ClassicEditorProps) {
  const { token } = useAuth();
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaCallback, setMediaCallback] = useState<((url: string, alt?: string) => void) | null>(null);
  const [content, setContent] = useState(initialValue);
  const isInternalChange = useRef(false);
  
  // Cập nhật nội dung khi initialValue thay đổi
  useEffect(() => {
    if (!isInternalChange.current && initialValue !== content) {
      setContent(initialValue);
    }
  }, [initialValue, content]);

  // Handle editor initialization
  const handleEditorInit = (_evt: any, editor: any) => {
    editorRef.current = editor;
    setIsLoading(false);
  };

  // Handle content change
  const handleEditorChange = (newContent: string) => {
    isInternalChange.current = true;
    setContent(newContent);
    onChange(newContent);
    
    // Reset flag sau khi thực hiện thay đổi
    setTimeout(() => {
      isInternalChange.current = false;
    }, 10);
  };

  // Callback khi người dùng chọn ảnh từ thư viện
  const handleMediaSelect = (media: { id: number; url: string; title: string; alt: string }) => {
    if (mediaCallback) {
      mediaCallback(media.url, media.alt || media.title);
      setMediaCallback(null);
    }
    setShowMediaBrowser(false);
  };

  return (
    <div className="classic-editor-container">
      {isLoading && <Skeleton className="w-full h-64" />}

      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ''}
        onInit={handleEditorInit} 
        value={content}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | link image media | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          language: 'vi',
          language_url: '/tinymce/langs/vi.js',
          // Cấu hình quan trọng để cố định con trỏ
          keep_styles: true,
          cache_suffix: `?v=${Date.now()}`,
          auto_focus: false,
          entity_encoding: 'raw',
          // Image upload handler
          images_upload_handler: (blobInfo: { blob: () => Blob }, _progress: (percent: number) => void) => new Promise<string>((resolve, reject) => {
            if (!token) {
              reject('Bạn cần đăng nhập để tải lên hình ảnh');
              return;
            }

            uploadEditorImage(token, blobInfo.blob())
              .then(location => {
                resolve(location);
              })
              .catch(error => {
                console.error('Upload error:', error);
                reject('Lỗi tải lên hình ảnh');
              });
          }),
          automatic_uploads: true,
          image_title: true,
          image_caption: true,
          image_advtab: true,
          // Custom image picker button
          file_picker_callback: (callback: (url: string, obj: { title: string, alt?: string }) => void, value: string, meta: { filetype: string }) => {
            // Only handle images
            if (meta.filetype === 'image') {
              // Open media browser or file picker based on user choice
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              
              // Save callback for when the media browser is used
              setMediaCallback(() => (url: string, alt?: string) => {
                callback(url, { title: alt || '', alt: alt || '' });
              });
              
              // Show a custom context menu for image source
              const editor = editorRef.current;
              if (!editor) return;
              
              editor.windowManager.open({
                title: 'Chọn nguồn ảnh',
                body: {
                  type: 'panel',
                  items: [
                    {
                      type: 'htmlpanel',
                      html: '<p style="text-align: center;">Chọn nguồn ảnh bạn muốn sử dụng</p>'
                    }
                  ]
                },
                buttons: [
                  {
                    type: 'custom',
                    text: 'Tải lên từ máy tính',
                    name: 'upload',
                    primary: true
                  },
                  {
                    type: 'custom',
                    text: 'Chọn từ thư viện',
                    name: 'library'
                  }
                ],
                onAction: (api: { close: () => void }, details: { name: string }) => {
                  api.close();
                  if (details.name === 'upload') {
                    // Use file input for upload
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      
                      try {
                        const imageUrl = await uploadEditorImage(token || '', file);
                        callback(imageUrl, { title: file.name });
                      } catch (err) {
                        console.error('Upload error:', err);
                        const editor = editorRef.current;
                        if (editor) {
                          editor.notificationManager.open({
                            text: 'Lỗi khi tải lên ảnh',
                            type: 'error'
                          });
                        }
                      }
                    };
                    input.click();
                  } else if (details.name === 'library') {
                    // Open media browser
                    setShowMediaBrowser(true);
                  }
                }
              });
            }
          },
          setup: (editor: TinyMCEEditor) => {
            // Gắn sự kiện cho editor
            editor.on('init', (e: any) => {
              // Xử lý vấn đề con trỏ
              const editorElement = document.querySelector('.tox-edit-area__iframe');
              if (editorElement) {
                editorElement.setAttribute('tabindex', '-1');
              }
            });
            
            // Bắt sự kiện lỗi
            editor.on('error', (e: any) => {
              console.error('TinyMCE error:', e);
              if (onError) onError();
            });
          }
        }}
      />

      <div className="mt-2 text-xs text-muted-foreground">
        <p>Sử dụng thanh công cụ phía trên để định dạng nội dung. Có thể chèn hình ảnh, liên kết, bảng và định dạng văn bản.</p>
      </div>

      {/* Media Browser Dialog */}
      <MediaBrowser
        open={showMediaBrowser}
        onClose={() => {
          setShowMediaBrowser(false);
          setMediaCallback(null);
        }}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
