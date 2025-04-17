'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, HistogramSeries, LineSeries } from 'lightweight-charts';
import { StockAssets } from '@/services/stockDataTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Helper function to format date for the chart
const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Helper function to get quarter from date
const getQuarter = (date: Date): number => {
  return Math.floor(date.getMonth() / 3) + 1;
};

// Helper function to format date as quarter
const formatQuarter = (date: Date): string => {
  const quarter = getQuarter(date);
  const year = date.getFullYear();
  return `Q${quarter}/${year}`;
};

// Helper function to format date as year
const formatYear = (date: Date): string => {
  return `${date.getFullYear()}`;
};

type TimeInterval = 'quarter' | 'year';

interface EnhancedAssetsChartProps {
  data: StockAssets[];
  height?: number;
  width?: number;
  title?: string;
}

const EnhancedAssetsChart: React.FC<EnhancedAssetsChartProps> = ({
  data,
  height = 300,
  width = 600,
  title = 'Biểu đồ Tài sản',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('quarter');

  // Process data based on selected time interval
  const processData = (rawData: StockAssets[], interval: TimeInterval) => {
    if (!rawData || rawData.length === 0) return [];

    // Sort data by date
    const sortedData = [...rawData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (interval === 'quarter') {
      // For quarter view, we can use the data as is, but ensure dates are formatted correctly
      return sortedData;
    } else {
      // For year view, aggregate data by year
      const yearlyData: { [key: string]: StockAssets } = {};
      
      sortedData.forEach(item => {
        const date = new Date(item.date);
        const year = date.getFullYear().toString();
        
        if (!yearlyData[year]) {
          // Initialize with first entry for this year
          yearlyData[year] = {
            ...item,
            date: `${year}-12-31`, // Set to end of year for display purposes
          };
        } else {
          // Use the latest entry for each year
          const currentDate = new Date(yearlyData[year].date);
          const itemDate = new Date(item.date);
          
          if (itemDate > currentDate) {
            yearlyData[year] = {
              ...item,
              date: `${year}-12-31`, // Set to end of year for display purposes
            };
          }
        }
      });
      
      return Object.values(yearlyData);
    }
  };

  // Create or update chart when data or time interval changes
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Process data based on selected time interval
    const processedData = processData(data, timeInterval);
    
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
      tooltipRef.current.style.position = 'absolute';
      tooltipRef.current.style.zIndex = '1000';
      tooltipRef.current.style.backgroundColor = 'rgba(30, 30, 40, 0.9)';
      tooltipRef.current.style.color = '#DDD';
      tooltipRef.current.style.padding = '8px';
      tooltipRef.current.style.fontSize = '12px';
      tooltipRef.current.style.borderRadius = '4px';
      tooltipRef.current.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.5)';
      tooltipRef.current.style.pointerEvents = 'none';
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
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        // Increase spacing for better readability
        barSpacing: timeInterval === 'year' ? 30 : 20,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        autoScale: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
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

    // Create TTS histogram series (bar chart)
    const ttsHistogramSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      title: 'TTS',
    });

    const ttsData = processedData
      .filter(item => item.tts !== undefined)
      .map(item => {
        const value = typeof item.tts === 'string' ? parseFloat(item.tts as string) : Number(item.tts);
        return {
          time: formatDateForChart(item.date),
          value,
          color: '#26a69a', // Green color for TTS
        };
      });

    ttsHistogramSeries.setData(ttsData);
    seriesRef.current.push(ttsHistogramSeries);

    // Create VCSH histogram series (bar chart)
    const vcshHistogramSeries = chart.addSeries(HistogramSeries, {
      color: '#42a5f5',
      priceFormat: {
        type: 'volume',
      },
      title: 'VCSH',
    });

    const vcshData = processedData
      .filter(item => item.vcsh !== undefined)
      .map(item => {
        const value = typeof item.vcsh === 'string' ? parseFloat(item.vcsh as string) : Number(item.vcsh);
        return {
          time: formatDateForChart(item.date),
          value,
          color: '#42a5f5', // Blue color for VCSH
        };
      });

    vcshHistogramSeries.setData(vcshData);
    seriesRef.current.push(vcshHistogramSeries);

    // Create TB_TTS_NGANH line series
    const tbTtsNganhSeries = chart.addSeries(LineSeries, {
      color: '#ef5350',
      lineWidth: 2,
      title: 'TB TTS Ngành',
    });

    const tbTtsNganhData = processedData
      .filter(item => item.tb_tts_nganh !== undefined)
      .map(item => {
        const value = typeof item.tb_tts_nganh === 'string' 
          ? parseFloat(item.tb_tts_nganh as string) 
          : Number(item.tb_tts_nganh);
        return {
          time: formatDateForChart(item.date),
          value,
        };
      });

    tbTtsNganhSeries.setData(tbTtsNganhData);
    seriesRef.current.push(tbTtsNganhSeries);

    // Fit content
    if (processedData.length > 0) {
      const firstDate = formatDateForChart(processedData[0].date);
      const lastDate = formatDateForChart(processedData[processedData.length - 1].date);
      if (firstDate && lastDate) {
        try {
          chart.timeScale().setVisibleRange({
            from: firstDate as any,
            to: lastDate as any,
          });
        } catch (e) {
          console.error("Error setting visible range, falling back to fitContent:", e);
          chart.timeScale().fitContent();
        }
      } else {
        chart.timeScale().fitContent();
      }
    } else {
      chart.timeScale().fitContent();
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

      // Find the original data point to get all fields
      const dataPoint = processedData.find(item => formatDateForChart(item.date) === dateStr);

      if (!dataPoint) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      // Format tooltip content
      let tooltipContent = '';

      // Date formatting based on time interval
      const date = new Date(dataPoint.date);
      let formattedDate;
      
      if (timeInterval === 'quarter') {
        formattedDate = formatQuarter(date);
      } else {
        formattedDate = formatYear(date);
      }
      
      tooltipContent += `<div class="font-bold mb-1">${formattedDate}</div>`;

      // Format numbers with commas
      const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return 'N/A';
        return num.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
      };

      tooltipContent += `<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">`;
      tooltipContent += `
        <div class="text-gray-300" style="color: #26a69a">TTS:</div> <div class="text-right text-white" style="color: #26a69a">${formatNumber(dataPoint.tts)}</div>
        <div class="text-gray-300" style="color: #42a5f5">VCSH:</div> <div class="text-right text-white" style="color: #42a5f5">${formatNumber(dataPoint.vcsh)}</div>
        <div class="text-gray-300" style="color: #ef5350">TB TTS Ngành:</div> <div class="text-right text-white" style="color: #ef5350">${formatNumber(dataPoint.tb_tts_nganh)}</div>
      `;
      tooltipContent += `</div>`;

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

    // Cleanup
    return () => {
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
  }, [data, height, width, title, timeInterval]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        chartRef.current.resize(newWidth, height);
        // Re-apply time scale range after resize
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);
    // Call resize initially to set the correct width
    const timer = setTimeout(handleResize, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [height]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button 
          variant={timeInterval === 'quarter' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeInterval('quarter')}
        >
          Quý
        </Button>
        <Button 
          variant={timeInterval === 'year' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeInterval('year')}
        >
          Năm
        </Button>
      </div>
      <div className="relative w-full">
        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
      </div>
    </div>
  );
};

export default EnhancedAssetsChart;
