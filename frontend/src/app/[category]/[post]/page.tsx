'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Home, Calendar, User, Eye, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ClassicEditor from '@/components/editor/ClassicEditor';
import { getPostByCategoryAndSlug, getRelatedPosts, Post } from '@/services/postService';

export default function PostPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const postSlug = params.post as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug || !postSlug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const postData = await getPostByCategoryAndSlug(categorySlug, postSlug);
        
        if (!postData) {
          setError('Không tìm thấy bài viết');
          return;
        }
        
        setPost(postData);
        
        // Tải các bài viết liên quan trong cùng một danh mục
        const relatedData = await getRelatedPosts(postData.id, postData.category_id);
        setRelatedPosts(relatedData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug, postSlug]);

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

  // Truncate text to a specific length
  const truncateText = (text: string, maxLength: number) => {
    // Remove HTML tags first
    const plainText = text.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-6 w-1/2 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-8" />
        
        <Skeleton className="h-[400px] w-full mb-8" />
        
        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
        
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">{error || 'Không tìm thấy bài viết'}</h1>
          <p className="mt-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Quay lại trang chủ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/bai-viet">Bài viết</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${post.category_slug}`}>{post.category_name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink>{post.title}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <article className="mb-12">
        <div className="mb-6">
          <Badge variant="outline" className="mb-2">
            <Link href={`/${post.category_slug}`}>
              {post.category_name}
            </Link>
          </Badge>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={post.user_avatar || ''} alt={post.username} />
                <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{post.username}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(post.created_at)}</span>
            </div>
            {post.views && (
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>{post.views} lượt xem</span>
              </div>
            )}
            <div className="flex items-center ml-auto">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {post.thumbnail && (
            <div className="relative pb-[55%] mb-6 overflow-hidden rounded-lg shadow-md">
              <img 
                src={post.thumbnail} 
                alt={post.thumbnail_alt || post.title} 
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div>
            <Button variant="outline" className="mr-2">
              <Link href={`/${post.category_slug}`}>
                Quay lại danh mục
              </Link>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </article>
      
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {relatedPost.thumbnail && (
                  <div className="relative pb-[55%] overflow-hidden">
                    <Link href={`/${relatedPost.category_slug}/${relatedPost.slug}`}>
                      <img 
                        src={relatedPost.thumbnail} 
                        alt={relatedPost.thumbnail_alt || relatedPost.title} 
                        className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Link href={`/${relatedPost.category_slug}`}>
                        {relatedPost.category_name}
                      </Link>
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(relatedPost.created_at)}
                    </div>
                  </div>
                  <Link href={`/${relatedPost.category_slug}/${relatedPost.slug}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {truncateText(relatedPost.content, 100)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 