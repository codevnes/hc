'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StockRangeChart from '@/components/charts/StockRangeChart';
import ChartJsAssetsChart from '@/components/charts/ChartJsAssetsChart';
import MetricsChart from '@/components/charts/MetricsChart';
import EPSChart from '@/components/charts/EPSChart';
import PEChart from '@/components/charts/PEChart';
import { Stock } from '@/services/stockService'; // Assuming Stock type is defined here
import { getStocksBySymbol } from '@/services/stockService'; // Using only getStocksBySymbol since it doesn't require auth
import { getProfile } from '@/services/stockProfile'; // Import the profile service
import { StockAssets, StockMetrics, StockEPS, StockPE } from '@/services/stockDataTypes'; // Import the data types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Define interfaces for profile data
interface ProfileData {
  stockInfo: any;
  stockDaily: Stock[];
  stockEPS: StockEPS[];
  stockAssets: StockAssets[];
  stockMetrics: StockMetrics[];
  stockPE?: StockPE[];
}

// Define a more detailed interface with all the stock fields
type StockDetail = Stock & {
  name?: string;
  close_price?: number;
  return_value?: number;
  kldd?: number;
  von_hoa?: number;
  pe?: number;
  roa?: number;
  roe?: number;
  eps?: number;
  trade_date?: string; // Add trade_date for stockDaily data
};

const StockDetailPage = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  const [filteredStockData, setFilteredStockData] = useState<StockDetail[] | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '6m' | '1y' | '5y'>('1y');

  useEffect(() => {
    if (symbol) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch profile data
          const profile = await getProfile(symbol.toUpperCase());
          if (profile) {
            setProfileData(profile);

            // Use stockDaily data from profile
            if (profile.stockDaily && profile.stockDaily.length > 0) {
              // Convert stockDaily to StockDetail format
              const stockDailyData = profile.stockDaily.map((item: any) => {
                const result = {
                  id: item.id,
                  symbol: item.symbol,
                  date: new Date(item.trade_date).toISOString(),
                  volume: item.volume,
                  close_price: parseFloat(item.close_price),
                  return_value: item.return_value,
                  kldd: item.kldd,
                  von_hoa: parseFloat(item.von_hoa),
                  pe: parseFloat(item.pe),
                  roa: parseFloat(item.roa),
                  roe: parseFloat(item.roe),
                  eps: parseFloat(item.eps),
                  name: item.stock_name
                };
                return result;
              });

              setFilteredStockData(stockDailyData);
            } else {
              // Fallback to getStocksBySymbol if stockDaily is empty
              const data = await getStocksBySymbol(symbol.toUpperCase());
              if (data && data.length > 0) {
                setFilteredStockData(data);
              } else {
                setError('Không tìm thấy dữ liệu cho mã này.');
                setFilteredStockData(null);
              }
            }
          } else {
            // Fallback to getStocksBySymbol if profile is empty
            const data = await getStocksBySymbol(symbol.toUpperCase());
            if (data && data.length > 0) {
              setFilteredStockData(data);
            } else {
              setError('Không tìm thấy dữ liệu cho mã này.');
              setFilteredStockData(null);
            }
          }
        } catch (err: any) {
          console.error("Error fetching data:", err);
          setError(err.message || 'Lỗi khi tải dữ liệu chứng khoán.');
          setFilteredStockData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [symbol]);

  // Handle time range change
  const handleTimeRangeChange = (range: '1m' | '6m' | '1y' | '5y') => {
    setTimeRange(range);
    // StockRangeChart will handle fetching data for the selected time range
  };

  return (
    <div className="container mx-auto p-4">
      {/* Stock Info Header */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{symbol?.toUpperCase()}</h1>
                {profileData?.stockInfo && (
                  <Badge variant="outline" className="text-sm">
                    {profileData.stockInfo.exchange}
                  </Badge>
                )}
              </div>
              {profileData?.stockInfo && (
                <div className="text-lg text-muted-foreground">
                  {profileData.stockInfo.name}
                </div>
              )}
            </div>

            {filteredStockData && filteredStockData.length > 0 && (
              <div className="flex flex-col items-end">
                <div className="text-3xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(filteredStockData[filteredStockData.length - 1].close_price || filteredStockData[filteredStockData.length - 1].close || 0)}
                </div>
                <div className="text-sm">
                  Cập nhật: {new Date(filteredStockData[filteredStockData.length - 1].date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}
          </div>

          {profileData?.stockInfo?.description && (
            <div className="mt-4 text-sm text-muted-foreground">
              {profileData.stockInfo.description}
            </div>
          )}

          {profileData?.stockInfo?.industry && (
            <div className="mt-2 mb-4">
              <Badge variant="secondary">{profileData.stockInfo.industry}</Badge>
            </div>
          )}

          {/* Stock Metrics Grid */}
          {filteredStockData && filteredStockData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">Giá đóng cửa</div>
                <div className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN').format(filteredStockData[filteredStockData.length - 1]?.close_price || filteredStockData[filteredStockData.length - 1]?.close || 0)}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">Khối lượng giao dịch</div>
                <div className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN').format(filteredStockData[filteredStockData.length - 1]?.kldd || 0)}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">Vốn hóa (tỷ đồng)</div>
                <div className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN').format((filteredStockData[filteredStockData.length - 1]?.von_hoa || 0) / 1000000000)}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">P/E</div>
                <div className="text-lg font-semibold">
                  {filteredStockData[filteredStockData.length - 1]?.pe !== undefined && filteredStockData[filteredStockData.length - 1]?.pe !== null ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(filteredStockData[filteredStockData.length - 1]?.pe)) : 'N/A'}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">EPS</div>
                <div className="text-lg font-semibold">
                  {filteredStockData[filteredStockData.length - 1]?.eps !== undefined && filteredStockData[filteredStockData.length - 1]?.eps !== null ? new Intl.NumberFormat('vi-VN').format(Number(filteredStockData[filteredStockData.length - 1]?.eps)) : 'N/A'}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">ROA (%)</div>
                <div className="text-lg font-semibold">
                  {filteredStockData[filteredStockData.length - 1]?.roa !== undefined && filteredStockData[filteredStockData.length - 1]?.roa !== null ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(filteredStockData[filteredStockData.length - 1]?.roa)) : 'N/A'}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">ROE (%)</div>
                <div className="text-lg font-semibold">
                  {filteredStockData[filteredStockData.length - 1]?.roe !== undefined && filteredStockData[filteredStockData.length - 1]?.roe !== null ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(filteredStockData[filteredStockData.length - 1]?.roe)) : 'N/A'}
                </div>
              </div>

              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-sm text-muted-foreground">Thay đổi (%)</div>
                <div className="text-lg font-semibold">
                  {(() => {
                    const returnValue = filteredStockData[filteredStockData.length - 1]?.return_value;
                    if (returnValue !== undefined && returnValue !== null) {
                      const colorClass = returnValue > 0 ? 'text-green-500' : returnValue < 0 ? 'text-red-500' : '';
                      return (
                        <span className={colorClass}>
                          {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(returnValue)) + '%'}
                        </span>
                      );
                    }
                    return 'N/A';
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500">Lỗi: {error}</p>}

      {filteredStockData && filteredStockData.length > 0 && (
        <div className="grid mb-4 grid-cols-1 gap-4">
          {/* Section for basic info - currently removed */}

          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ giá</CardTitle>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={timeRange === '1m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange('1m')}
                >
                  1 tháng
                </Button>
                <Button
                  variant={timeRange === '6m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange('6m')}
                >
                  6 tháng
                </Button>
                <Button
                  variant={timeRange === '1y' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange('1y')}
                >
                  1 năm
                </Button>
                <Button
                  variant={timeRange === '5y' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange('5y')}
                >
                  5 năm
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StockRangeChart
                symbol={symbol}
                timeRange={timeRange}
                chartType="candlestick"
                height={400}
                // width can be omitted to use container width
                title={`Biểu đồ ${symbol?.toUpperCase()}`}
              />
            </CardContent>
          </Card>

          {/* Section for volume chart - currently removed */}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ Tài sản</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData && profileData.stockAssets && profileData.stockAssets.length > 0 ? (
              <ChartJsAssetsChart
                data={profileData.stockAssets}
                height={300}
                title={`Tài sản ${symbol?.toUpperCase()}`}
              />
            ) : (
              <p>Không có dữ liệu tài sản</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ ROA/ROE</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData && profileData.stockMetrics && profileData.stockMetrics.length > 0 ? (
              <MetricsChart
                data={profileData.stockMetrics}
                height={300}
                title={`ROA/ROE ${symbol?.toUpperCase()}`}
              />
            ) : (
              <p>Không có dữ liệu ROA/ROE</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ EPS</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData && profileData.stockEPS && profileData.stockEPS.length > 0 ? (
              <EPSChart
                data={profileData.stockEPS}
                height={300}
                title={`EPS ${symbol?.toUpperCase()}`}
              />
            ) : (
              <p>Không có dữ liệu EPS</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ P/E</CardTitle>
          </CardHeader>
          <CardContent>
            {profileData && profileData.stockPE && profileData.stockPE.length > 0 ? (
              <PEChart
                data={profileData.stockPE}
                height={300}
                title={`P/E ${symbol?.toUpperCase()}`}
              />
            ) : (
              <p>Không có dữ liệu P/E</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default StockDetailPage;
