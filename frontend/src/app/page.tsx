'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StockChart from '@/components/charts/StockChart';
import { getAvailableSymbols, Stock, StockInfo, getStocksByDateRange } from '@/services/stockService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Search, Calendar, User } from "lucide-react"; // Icons
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { format } from 'date-fns'; // Import date-fns format
import { Input } from "@/components/ui/input"; // Import Input for search
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getAllCategories, getPostsByCategory, Post, Category } from "@/services/postService";

// Helper type for time range
type TimeRange = '1m' | '6m' | '1y' | '5y';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('VNINDEX');
  const [availableSymbols, setAvailableSymbols] = useState<StockInfo[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<StockInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y'); // Default to 1 year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch available symbols
        const symbolsData = await getAvailableSymbols();
        setAvailableSymbols(symbolsData);
        setFilteredSymbols(symbolsData);

        // --- Calculate Date Range --- 
        const now = new Date();
        const startDate = new Date();
        const endDate = format(now, 'yyyy-MM-dd'); // End date is today

        switch (timeRange) {
          case '1m':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case '6m':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case '5y':
            startDate.setFullYear(now.getFullYear() - 5);
            break;
          default: // Default to 1 year if range is invalid
            startDate.setFullYear(now.getFullYear() - 1);
        }
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        // --- End Calculate Date Range ---

        // Fetch stocks for the selected symbol AND date range
        const stocksData = await getStocksByDateRange(formattedStartDate, endDate, selectedSymbol);

        // Data from API might already be sorted, but ensure chronological for chart
        const sortedStocks = stocksData.sort((a: Stock, b: Stock) =>
          new Date(a.date).getTime() - new Date(b.date).getTime() // Ascending for chart
        );

        setStocks(sortedStocks);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setStocks([]); // Clear stocks on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSymbol, timeRange]); // Add timeRange dependency

  // Fetch posts and categories
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);

        // Fetch categories and posts
        const [categoriesData, postsData] = await Promise.all([
          getAllCategories(),
          getAllPosts()
        ]);

        setCategories(categoriesData);
        setPosts(postsData);

        // Đặt danh mục đầu tiên làm mặc định nếu có
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].slug);
        }
      } catch (err) {
        console.error('Lỗi khi lấy bài viết và danh mục:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle category change
  useEffect(() => {
    const fetchPostsByCategory = async () => {
      try {
        setPostsLoading(true);

        if (!activeCategory) return;

        // Find category id 
        const categoryId = categories.find(cat => cat.slug === activeCategory)?.id;

        if (categoryId) {
          const postsData = await getPostsByCategory(categoryId);
          setPosts(postsData);
        }
      } catch (err) {
        console.error('Lỗi khi lấy bài viết theo danh mục:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    if (activeCategory) {
      fetchPostsByCategory();
    }
  }, [activeCategory, categories]);

  // Filter symbols based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSymbols(availableSymbols);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = availableSymbols.filter(
        symbol =>
          symbol.symbol.toLowerCase().includes(term) ||
          (symbol.name && symbol.name.toLowerCase().includes(term))
      );
      setFilteredSymbols(filtered);
    }
  }, [searchTerm, availableSymbols]);

  // Reset window.chartSyncRegistry when time range changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear the chart registry when time range changes to prevent sync issues
      window.chartSyncRegistry = {};
    }
  }, [timeRange]);

  // Use stocks directly, reverse for chart rendering if needed
  // Note: API already returns data sorted ASC, so no reverse needed here if StockChart handles it.
  // If StockChart expects newest first for processing but plots oldest first, keep reverse.
  // Let's assume StockChart handles chronological data (oldest first).
  const chartData = stocks;

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Format date for posts
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

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart Section - Now on the left (first 2 columns) */}
          <div className="md:col-span-2 space-y-6">
            <Card className='px-2 py-2'>
              <CardHeader className="flex flex-row items-center justify-between p-2 pb-0">
                <CardTitle className="text-lg font-semibold">
                  Biểu đồ {selectedSymbol}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {(['1m', '6m', '1y', '5y'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                    >
                      {range === '1m' && '1 Tháng'}
                      {range === '6m' && '6 Tháng'}
                      {range === '1y' && '1 Năm'}
                      {range === '5y' && '5 Năm'}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-0">
                <div className="chart-container">
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : chartData.length > 0 ? (
                    <div className="h-[250px]">
                      <StockChart
                        data={chartData}
                        chartType="candlestick"
                        height={250}
                        title={``}
                        syncGroup="homeCharts"
                        showTimeScale={false}
                        rightPriceScaleMinimumWidth={70}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      Không có dữ liệu giá.
                    </div>
                  )}
                </div>
                <div className="chart-container mt-[-1px]">
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : chartData.length > 0 ? (
                    <div className="h-[180px]">
                      <StockChart
                        data={chartData}
                        chartType="line"
                        lineOptions={{
                          fields: ['trend_q', 'fq'],
                          colors: ['#2196F3', '#FF9800']
                        }}
                        height={180}
                        title={``}
                        syncGroup="homeCharts"
                        showTimeScale={false}
                        rightPriceScaleMinimumWidth={70}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      Không có dữ liệu Trend/FQ.
                    </div>
                  )}
                </div>
                <div className="chart-container mt-[-1px]">
                  {loading ? (
                    <Skeleton className="h-52 w-full" />
                  ) : chartData.length > 0 ? (
                    <div className="h-[180px]">
                      <StockChart
                        data={chartData}
                        chartType="histogram"
                        height={180}
                        title={`123`}
                        syncGroup="homeCharts"
                        showTimeScale={true}
                        rightPriceScaleMinimumWidth={70}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      Không có dữ liệu QV1.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock List Section - Now on the right (last column) */}
          <div className="md:col-span-1">
            {loading && availableSymbols.length === 0 ? (
              <Card className='h-full border-none'>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card className='h-full gap-2 border-none'>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Danh sách Mã CK</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm mã CK..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-8"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-200px)] w-full">
                    <div className="p-4 space-y-1">
                      {filteredSymbols.length > 0 ? (
                        filteredSymbols.map((symbolInfo) => (
                          <Button
                            key={symbolInfo.symbol}
                            variant={selectedSymbol === symbolInfo.symbol ? "secondary" : "ghost"}
                            onClick={() => setSelectedSymbol(symbolInfo.symbol)}
                            className="w-full justify-start text-left h-auto py-2 px-3"
                          >
                            <div>
                              <div className="font-medium">{symbolInfo.symbol}</div>
                              <div className="text-xs text-muted-foreground">{symbolInfo.name}</div>
                            </div>
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          {searchTerm ? `Không tìm thấy mã "${searchTerm}"` : 'Không có mã nào.'}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 mt-8 gap-4">
          <Card className=''>
            Thông tin cổ phiếu
          </Card>
          <Card className=''>
            1 chart bất kỳ
          </Card>
        </div>
        
        {/* Blog Posts Grid Section with Tabs */}
        <section className="mt-12" aria-labelledby="blog-heading">
          <h2 id="blog-heading" className="text-2xl font-bold mb-6">Bài viết mới nhất</h2>

          <Tabs value={activeCategory} className="w-full" onValueChange={setActiveCategory}>
            <TabsList className="mb-6 border-b w-full flex flex-wrap justify-start h-auto py-0 bg-transparent">
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.slug}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary px-4 py-2"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Render tab content for each category */}
            {categories.map(category => (
              <TabsContent key={category.id} value={category.slug} className="mt-0">
                {postsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-[200px] w-full" />
                        <CardHeader>
                          <Skeleton className="h-5 w-4/5 mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <article key={post.id} className="group h-full">
                        <Card className="h-full flex pt-0 flex-col overflow-hidden hover:shadow-md transition-shadow">
                          {post.thumbnail && (
                            <div className="relative pb-[55%] overflow-hidden">
                              <Link href={`/${post.category_slug}/${post.slug}`}>
                                <Image
                                  src={post.thumbnail}
                                  alt={post.thumbnail_alt || post.title}
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  fill
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Không tìm thấy bài viết nào trong danh mục này.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="text-center mt-8">
            <Link href="/bai-viet">
              <Button size="lg" variant="outline">
                Xem tất cả bài viết
              </Button>
            </Link>
          </div>
        </section>



      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} HC Stock. All rights reserved.
      </footer>
    </div>
  );
}
