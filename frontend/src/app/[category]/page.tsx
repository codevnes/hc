'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPostsByCategorySlug, getCategoryBySlug, Post, Category } from '@/services/postService';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Home, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [categoryData, postsData] = await Promise.all([
          getCategoryBySlug(categorySlug),
          getPostsByCategorySlug(categorySlug)
        ]);
        
        if (!categoryData) {
          setError('Không tìm thấy danh mục');
          return;
        }
        
        setCategory(categoryData);
        setPosts(postsData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
        <Skeleton className="h-8 w-1/2 mb-6" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-[200px] w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">{error}</h1>
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
            <BreadcrumbLink>{category?.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category?.name}</h1>
        {category?.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>
      
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="group h-full">
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                {post.thumbnail && (
                  <div className="relative pb-[55%] overflow-hidden">
                    <Link href={`/${categorySlug}/${post.slug}`}>
                      <img 
                        src={post.thumbnail} 
                        alt={post.thumbnail_alt || post.title} 
                        className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Link href={`/${post.category_slug}`}>
                        {post.category_name}
                      </Link>
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                  <Link href={`/${categorySlug}/${post.slug}`}>
                    <CardTitle className="text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {truncateText(post.content, 150)}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span>{post.username}</span>
                  </div>
                </CardFooter>
              </Card>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <p className="text-xl">Không có bài viết nào trong danh mục này.</p>
          <Link href="/bai-viet" className="mt-4 inline-block">
            <Button variant="outline" className="mt-2">Xem tất cả bài viết</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 