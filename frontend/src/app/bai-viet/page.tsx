'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllPosts, getAllCategories, Post, Category } from '@/services/postService';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Home, Calendar, User, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function AllPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all posts and categories on initial load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [postsData, categoriesData] = await Promise.all([
          getAllPosts(),
          getAllCategories()
        ]);
        
        setPosts(postsData);
        setFilteredPosts(postsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter posts when category or search query changes
  useEffect(() => {
    let filtered = [...posts];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(post => post.category_slug === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query)
      );
    }
    
    setFilteredPosts(filtered);
  }, [activeCategory, searchQuery, posts]);

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
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-10 w-full mb-8" />
        
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
            <BreadcrumbLink>Bài viết</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Bài viết</h1>
        <p className="text-muted-foreground">
          Tổng hợp thông tin phân tích, tin tức và nhận định thị trường chứng khoán
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs 
          value={activeCategory} 
          onValueChange={setActiveCategory}
          className="w-full md:w-1/2"
        >
          <TabsList className="w-full overflow-auto flex whitespace-nowrap">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.slug}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article key={post.id} className="group h-full">
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                {post.thumbnail && (
                  <div className="relative pb-[55%] overflow-hidden">
                    <Link href={`/${post.category_slug}/${post.slug}`}>
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
                  <Link href={`/${post.category_slug}/${post.slug}`}>
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
          <p className="text-xl">Không tìm thấy bài viết nào.</p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Xóa tìm kiếm
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 