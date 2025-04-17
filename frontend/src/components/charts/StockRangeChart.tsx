'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import axios from 'axios';

// Helper function to format date for the chart
const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

interface StockData {
  id: number;
  symbol: string;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  band_dow?: number;
  band_up?: number;
  trend_q?: number;
  fq?: number;
  qv1?: number;
  stock_name?: string;
}

interface StockRangeChartProps {
  symbol: string;
  timeRange: '1m' | '6m' | '1y' | '5y';
  chartType: 'candlestick' | 'line' | 'histogram';
  lineOptions?: {
    fields: Array<'trend_q' | 'fq'>;
    colors: string[];
  };
  height?: number;
  width?: number;
  title?: string;
  showTimeScale?: boolean;
  syncGroup?: string;
  rightPriceScaleMinimumWidth?: number;
}

// Define a global type for the sync registry if it doesn't exist
declare global {
  interface Window {
    chartSyncRegistry?: { [key: string]: IChartApi[] };
  }
}

const StockRangeChart: React.FC<StockRangeChartProps> = ({
  symbol,
  timeRange,
  chartType,
  lineOptions,
  height = 300,
  width = 600,
  title = '',
  showTimeScale = true,
  syncGroup,
  rightPriceScaleMinimumWidth
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calculate date range based on selected time range
        const endDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
        const startDate = new Date();

        switch (timeRange) {
          case '1m':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case '6m':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case '5y':
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
        }

        // Format startDate as YYYY-MM-DD
        const formattedStartDate = startDate.toISOString().split('T')[0];

        // Fetch data from the API
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stocks/range?startDate=${formattedStartDate}&endDate=${endDate}&symbol=${symbol.toUpperCase()}`);

        if (response.data && response.data.length > 0) {
          // Add dummy OHLC data for testing if needed
          const processedData = response.data.map((item: any) => {
            // Ensure we have a date field
            const date = item.date || item.trade_date;
            if (!date) {
              console.warn('Item missing date field:', item);
              return null;
            }

            return {
              ...item,
              date: date,
              // Ensure numeric values
              close_price: parseFloat(item.close_price || 0),
              // Add other fields as needed
            };
          }).filter(Boolean); // Remove null items

          setData(processedData);
        } else {
          // Fallback to fetching from symbol endpoint
          try {
            const symbolResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stocks/symbol/${symbol.toUpperCase()}`);
            if (symbolResponse.data && symbolResponse.data.length > 0) {
              setData(symbolResponse.data);
            } else {
              setError('Không có dữ liệu cho khoảng thời gian này');
            }
          } catch (fallbackErr) {
            console.error('Error fetching fallback data:', fallbackErr);
            setError('Không có dữ liệu cho khoảng thời gian này');
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        // Try fallback to symbol endpoint
        try {
          const symbolResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stocks/symbol/${symbol.toUpperCase()}`);
          if (symbolResponse.data && symbolResponse.data.length > 0) {
            setData(symbolResponse.data);
          } else {
            setError(err.message || 'Lỗi khi tải dữ liệu');
          }
        } catch (fallbackErr) {
          setError(err.message || 'Lỗi khi tải dữ liệu');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeRange]);

  // Create and update chart
  useEffect(() => {
    if (!chartContainerRef.current || loading || error) return;

    // Check if we have enough data points
    if (data.length < 2) {
      console.warn('Not enough data points for chart. Need at least 2 points.');
      return;
    }

    // Clear previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = [];
    }

    // Calculate container width if width is not provided
    const containerWidth = width || chartContainerRef.current.clientWidth || 800;

    // Create tooltip element
    if (!tooltipRef.current && chartContainerRef.current) {
      tooltipRef.current = document.createElement('div');
      // Basic inline styles for dark theme tooltip
      tooltipRef.current.style.position = 'absolute';
      tooltipRef.current.style.zIndex = '1000';
      tooltipRef.current.style.backgroundColor = 'rgba(30, 30, 40, 0.9)';
      tooltipRef.current.style.color = '#DDD';
      tooltipRef.current.style.padding = '8px';
      tooltipRef.current.style.fontSize = '12px';
      tooltipRef.current.style.borderRadius = '4px';
      tooltipRef.current.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.5)';
      tooltipRef.current.style.pointerEvents = 'none'; // Prevent tooltip from interfering with mouse events
      chartContainerRef.current.appendChild(tooltipRef.current);
    }

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: 'oklch(.21 .034 264.665)' }, // Dark background
          textColor: '#DDD', // Light text for dark background
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.1)' }, // Darker grid lines for dark theme
          horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.2)', // Darker border for dark theme
          timeVisible: showTimeScale,
          secondsVisible: false,
          visible: showTimeScale,
          rightOffset: 5, // Add some padding on the right
          barSpacing: 6, // Consistent spacing between bars
          fixLeftEdge: false, // Don't fix edges to prevent range errors
          fixRightEdge: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.2)', // Darker border for dark theme
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          autoScale: true,
          minimumWidth: rightPriceScaleMinimumWidth || 40, // Apply minimum width with default
        },
        crosshair: {
          mode: 1, // Magnet mode for better tooltips
          vertLine: {
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
            style: 3, // Dashed line
            visible: true,
            labelVisible: true,
          },
          horzLine: {
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
            style: 3, // Dashed line
            visible: true,
            labelVisible: true,
          },
        },
        localization: {
          locale: 'vi-VN',
          dateFormat: 'dd/MM/yyyy',
        },
      });

      chartRef.current = chart;

      // Add title if provided
      if (title) {
        const titleElement = document.createElement('div');
        titleElement.style.position = 'absolute';
        titleElement.style.top = '10px';
        titleElement.style.left = '10px';
        titleElement.style.color = '#DDD';
        titleElement.style.fontSize = '16px';
        titleElement.style.fontWeight = 'bold';
        titleElement.innerText = title;
        chartContainerRef.current.appendChild(titleElement);
      }

      // Sort data by date
      const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create series based on chart type
      if (chartType === 'candlestick') {
        // For candlestick, we need to use the stocks table data which has OHLC values
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        // Generate dummy OHLC data if not available
        const candlestickData = sortedData.map(item => {
          // Use close_price as the base if open/high/low/close are not available
          const basePrice = item.close_price || 100;

          // If we have all OHLC data, use it
          if (item.open !== undefined && item.high !== undefined &&
              item.low !== undefined && item.close !== undefined) {
            return {
              time: formatDateForChart(item.date),
              open: Number(item.open),
              high: Number(item.high),
              low: Number(item.low),
              close: Number(item.close),
            };
          }

          // Otherwise, generate dummy OHLC data based on close_price
          return {
            time: formatDateForChart(item.date),
            open: basePrice * 0.99, // Slightly lower than close
            high: basePrice * 1.01, // Slightly higher than close
            low: basePrice * 0.98,  // Lower than open
            close: basePrice,       // Use close_price as close
          };
        });

        if (candlestickData.length > 0) {
          candlestickSeries.setData(candlestickData);
          seriesRef.current.push(candlestickSeries);
        }
      }
      else if (chartType === 'line' && lineOptions) {
        lineOptions.fields.forEach((field, index) => {
          const lineSeries = chart.addSeries(LineSeries, {
            color: lineOptions.colors[index] || '#2196F3',
            lineWidth: 2,
          });

          const lineData = sortedData
            .filter(item => item[field] !== undefined && item[field] !== null)
            .map(item => {
              // Ensure value is converted to number
              const value = typeof item[field] === 'string'
                ? parseFloat(item[field] as string)
                : Number(item[field]);

              return {
                time: formatDateForChart(item.date),
                value: isNaN(value) ? 0 : value, // Prevent NaN values
              };
            });

          if (lineData.length > 0) {
            lineSeries.setData(lineData);
            seriesRef.current.push(lineSeries);
          }
        });
      }
      else if (chartType === 'histogram') {
        const histogramSeries = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });

        const histogramData = sortedData
          .filter(item => item.qv1 !== undefined && item.qv1 !== null)
          .map(item => {
            // Ensure value is converted to number
            const value = typeof item.qv1 === 'string'
              ? parseFloat(item.qv1 as string)
              : Number(item.qv1);

            return {
              time: formatDateForChart(item.date),
              value: isNaN(value) ? 0 : value, // Prevent NaN values
              color: value > 0 ? '#26a69a' : '#ef5350',
            };
          });

        if (histogramData.length > 0) {
          histogramSeries.setData(histogramData);
          seriesRef.current.push(histogramSeries);
        }
      }

      // Use fitContent instead of setVisibleRange to avoid range errors
      chart.timeScale().fitContent();

      // Setup tooltip handling
      chart.subscribeCrosshairMove((param) => {
        if (!tooltipRef.current) return;

        if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > containerWidth ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      // Find the data point for the current time
      const dateStr = typeof param.time === 'object'
        ? `${param.time.year}-${String(param.time.month).padStart(2, '0')}-${String(param.time.day).padStart(2, '0')}`
        : param.time.toString();

      // Find the original data point (before sorting) to get all fields
      const dataPoint = data.find(item => formatDateForChart(item.date) === dateStr);

      if (!dataPoint) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      // Format tooltip content based on chart type
      let tooltipContent = '';

      // Date formatting
      const formattedDate = new Date(dataPoint.date).toLocaleDateString('vi-VN');
      tooltipContent += `<div class="font-bold mb-1">${formattedDate}</div>`;

      // Format numbers with commas
      const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return 'N/A';
        return num.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      };

      // Tooltip Content Logic
      tooltipContent += `<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">`;

      if (chartType === 'candlestick') {
        tooltipContent += `
          <div class="text-gray-300">Mở:</div> <div class="text-right text-white">${formatNumber(dataPoint.open)}</div>
          <div class="text-gray-300">Cao:</div> <div class="text-right text-white">${formatNumber(dataPoint.high)}</div>
          <div class="text-gray-300">Thấp:</div> <div class="text-right text-white">${formatNumber(dataPoint.low)}</div>
          <div class="text-gray-300">Đóng:</div> <div class="text-right text-white">${formatNumber(dataPoint.close)}</div>
        `;
      } else if (chartType === 'line' && lineOptions) {
        lineOptions.fields.forEach((field, index) => {
          const fieldName = field === 'trend_q' ? 'Trend Q' : 'FQ';
          const color = lineOptions.colors[index] || '#2196F3';
          tooltipContent += `
            <div class="text-gray-400" style="color: ${color}">${fieldName}:</div>
            <div class="text-right" style="color: ${color}">${formatNumber(dataPoint[field])}</div>
          `;
        });
      } else if (chartType === 'histogram') {
        const qv1Value = dataPoint.qv1;
        const color = qv1Value && qv1Value > 0 ? '#26a69a' : '#ef5350';
        tooltipContent += `
          <div class="text-gray-400" style="color: ${color}">QV1:</div>
          <div class="text-right" style="color: ${color}">${formatNumber(qv1Value)}</div>
        `;
      }

      tooltipContent += `</div>`; // Close the grid div

      // Position and show tooltip
      tooltipRef.current.innerHTML = tooltipContent;
      tooltipRef.current.style.display = 'block';

      const tooltipWidth = tooltipRef.current.clientWidth;
      const tooltipHeight = tooltipRef.current.clientHeight;

      let left = param.point.x + 20;
      if (left + tooltipWidth > containerWidth) {
        left = param.point.x - tooltipWidth - 20;
      }

      let top = param.point.y - tooltipHeight / 2;
      if (top < 0) {
        top = 0;
      } else if (top + tooltipHeight > height) {
        top = height - tooltipHeight;
      }

      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
    });

    // If syncGroup is provided, store the chart in a global registry for syncing
    if (syncGroup && typeof window !== 'undefined') {
      // Create the registry if it doesn't exist
      if (!window.chartSyncRegistry) {
        window.chartSyncRegistry = {};
      }

      // Add this chart to the registry
      if (!window.chartSyncRegistry[syncGroup]) {
        window.chartSyncRegistry[syncGroup] = [];
      }
      // Avoid adding the same chart instance multiple times if effect runs again
      if (!window.chartSyncRegistry[syncGroup].includes(chart)) {
         window.chartSyncRegistry[syncGroup].push(chart);
      }

      // Sync the time scales of all charts in this group
      const syncTimeScale = () => {
        const registry = window.chartSyncRegistry || {};
        const charts = registry[syncGroup] || [];
        if (charts && charts.length > 1) {
          // Find the current chart's visible range
          const currentChartTimeScale = chart.timeScale();
          const visibleRange = currentChartTimeScale.getVisibleRange();
          const logicalRange = currentChartTimeScale.getVisibleLogicalRange();

          // Apply the same visible range to all other charts in the group
          if (visibleRange) {
            charts.forEach(otherChart => {
              if (otherChart !== chart) { // Don't apply to self
                  try {
                    otherChart.timeScale().setVisibleRange(visibleRange);
                    // Also sync logical range for better alignment
                    if (logicalRange) {
                      otherChart.timeScale().setVisibleLogicalRange(logicalRange);
                    }
                  } catch(e) {
                     console.error("Error syncing time scale:", e)
                  }
              }
            });
          }
        }
      };

      // Subscribe to time scale changes for syncing
      chart.timeScale().subscribeVisibleTimeRangeChange(syncTimeScale);

      // Modified Crosshair Move Sync Logic
      chart.subscribeCrosshairMove((param) => {
        const registry = window.chartSyncRegistry || {};
        const charts = registry[syncGroup] || [];

        charts.forEach(otherChart => {
          if (otherChart !== chartRef.current) { // Use chartRef.current here
             try {
               // Sync crosshair position using logical index
               otherChart.timeScale().scrollToPosition(param.logical || 0, true);
             } catch (e) {
                console.error("Error syncing crosshair:", e);
             }
          }
        });
      });
    }

    } catch (err) {
      console.error('Error creating chart:', err);
    }

    // Cleanup
    return () => {
       // Remove chart from sync group on cleanup
       if (syncGroup && typeof window !== 'undefined' && window.chartSyncRegistry?.[syncGroup]) {
          window.chartSyncRegistry[syncGroup] = window.chartSyncRegistry[syncGroup].filter(c => c !== chartRef.current);
          if (window.chartSyncRegistry[syncGroup].length === 0) {
             delete window.chartSyncRegistry[syncGroup];
          }
       }

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = [];
      }

      // Remove tooltip element
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [data, chartType, lineOptions, height, width, title, showTimeScale, syncGroup, rightPriceScaleMinimumWidth, loading, error]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        chartRef.current.resize(newWidth, height);
        // Re-apply time scale range after resize
        if (data.length > 0) {
           const firstDate = formatDateForChart(data[0].date);
           const lastDate = formatDateForChart(data[data.length - 1].date);
            if (firstDate && lastDate) {
              try {
                chartRef.current.timeScale().setVisibleRange({
                  from: firstDate as any,
                  to: lastDate as any,
                });
              } catch (e) { console.error("Resize setVisibleRange error:", e); }
            }
        } else {
            chartRef.current.timeScale().fitContent();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Call resize initially to set the correct width
    const timer = setTimeout(handleResize, 50); // Delay slightly for layout to settle

    return () => {
       clearTimeout(timer);
       window.removeEventListener('resize', handleResize);
    };
  }, [height, data]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (data.length === 0) {
    return <div>Không có dữ liệu</div>;
  }

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default StockRangeChart;
