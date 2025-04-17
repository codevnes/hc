'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { Stock } from '@/services/stockService';

// Helper function to format date for the chart
const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

interface StockChartProps {
  data: Stock[];
  chartType: 'candlestick' | 'line' | 'histogram';
  lineOptions?: {
    fields: Array<'trend_q' | 'fq'>;
    colors: string[];
  };
  height?: number;
  width?: number;
  title?: string;
  showTimeScale?: boolean; // Whether to show the time scale (x-axis)
  syncGroup?: string; // Group ID for syncing charts
  rightPriceScaleMinimumWidth?: number; // New prop for minimum width
}

// Define a global type for the sync registry if it doesn't exist
declare global {
  interface Window {
    chartSyncRegistry?: { [key: string]: IChartApi[] };
  }
}

const StockChart: React.FC<StockChartProps> = ({
  data,
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

  useEffect(() => {
    if (!chartContainerRef.current) return;

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
        fixLeftEdge: true, // Fix left edge to prevent scrolling beyond data
        fixRightEdge: true, // Fix right edge to prevent scrolling beyond data
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)', // Darker border for dark theme
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        autoScale: true,
        minimumWidth: rightPriceScaleMinimumWidth, // Apply minimum width
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
      // In v5, we need to first create the series definition
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      const candlestickData = sortedData
        .filter(item => item.open !== undefined && item.high !== undefined &&
                        item.low !== undefined && item.close !== undefined)
        .map(item => {
          // Ensure all values are converted to numbers
          const open = typeof item.open === 'string' ? parseFloat(item.open) : Number(item.open);
          const high = typeof item.high === 'string' ? parseFloat(item.high) : Number(item.high);
          const low = typeof item.low === 'string' ? parseFloat(item.low) : Number(item.low);
          const close = typeof item.close === 'string' ? parseFloat(item.close) : Number(item.close);

          return {
            time: formatDateForChart(item.date),
            open,
            high,
            low,
            close,
          };
        });

      candlestickSeries.setData(candlestickData);
      seriesRef.current.push(candlestickSeries);
    }
    else if (chartType === 'line' && lineOptions) {
      lineOptions.fields.forEach((field, index) => {
        const lineSeries = chart.addSeries(LineSeries, {
          color: lineOptions.colors[index] || '#2196F3',
          lineWidth: 2,
        });

        const lineData = sortedData
          .filter(item => item[field] !== undefined)
          .map(item => {
            // Ensure value is converted to number
            const value = typeof item[field] === 'string'
              ? parseFloat(item[field] as string)
              : Number(item[field]);

            return {
              time: formatDateForChart(item.date),
              value,
            };
          });

        lineSeries.setData(lineData);
        seriesRef.current.push(lineSeries);
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
        .filter(item => item.qv1 !== undefined)
        .map(item => {
          // Ensure value is converted to number
          const value = typeof item.qv1 === 'string'
            ? parseFloat(item.qv1 as string)
            : Number(item.qv1);

          return {
            time: formatDateForChart(item.date),
            value,
            color: value > 0 ? '#26a69a' : '#ef5350',
          };
        });

      histogramSeries.setData(histogramData);
      seriesRef.current.push(histogramSeries);
    }

    // Fit content - Replace with setVisibleRange
    // chart.timeScale().fitContent();
    if (sortedData.length > 0) {
      const firstDate = formatDateForChart(sortedData[0].date);
      const lastDate = formatDateForChart(sortedData[sortedData.length - 1].date);
      // Ensure the dates are valid before setting the range
      if (firstDate && lastDate) {
        try {
          chart.timeScale().setVisibleRange({
            from: firstDate as any, // Cast to any as lightweight-charts types might be strict
            to: lastDate as any,
          });
        } catch (e) {
          console.error("Error setting visible range, falling back to fitContent:", e);
          chart.timeScale().fitContent(); // Fallback if setVisibleRange fails
        }
      } else {
         chart.timeScale().fitContent(); // Fallback if dates are invalid
      }
    } else {
       chart.timeScale().fitContent(); // Keep fitContent as fallback for empty data
    }

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

      // --- Tooltip Content Logic (Instance Specific) ---
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
      // --- End Tooltip Content Logic ---

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

      // --- Modified Crosshair Move Sync Logic ---
      chart.subscribeCrosshairMove((param) => {
        const registry = window.chartSyncRegistry || {};
        const charts = registry[syncGroup] || [];

        charts.forEach(otherChart => {
          if (otherChart !== chartRef.current) { // Use chartRef.current here
             try {
               // Sync crosshair position using logical index
               otherChart.timeScale().scrollToPosition(param.logical || 0, true);
               // Attempt to move the crosshair directly (might be less reliable)
               // otherChart.setCrosshairPosition(param.point.x, param.point.y, chart.timeScale());
             } catch (e) {
                console.error("Error syncing crosshair:", e);
             }
          }
        });

        // Individual tooltip update logic is already handled above
      });
       // --- End Modified Sync Logic ---
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
     // Ensure all dependencies that affect the chart creation are included
  }, [data, chartType, lineOptions, height, width, title, showTimeScale, syncGroup, rightPriceScaleMinimumWidth]);

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
  }, [height, data]); // Re-run when data or height changes

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default StockChart;