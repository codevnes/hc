'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Dynamically import ClassicEditor to avoid SSR issues
const ClassicEditor = dynamic(() => import('./ClassicEditor'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-64" />
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  height = 500
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Initialize on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If fallback is needed or client-side rendering hasn't started yet
  if (!isMounted || useFallback) {
    return (
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[300px]"
          rows={15}
        />
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Bạn có thể sử dụng HTML cơ bản để định dạng nội dung.</p>
          <p>Ví dụ: &lt;b&gt;in đậm&lt;/b&gt;, &lt;i&gt;in nghiêng&lt;/i&gt;, &lt;ul&gt;&lt;li&gt;danh sách&lt;/li&gt;&lt;/ul&gt;</p>
        </div>
      </div>
    );
  }

  // Show the Classic editor
  return (
    <div className="relative border rounded-md overflow-hidden">
      <ClassicEditor
        initialValue={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onError={() => setUseFallback(true)}
        height={height}
      />
    </div>
  );
}