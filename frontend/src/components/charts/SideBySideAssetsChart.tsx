'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, LineSeries } from 'lightweight-charts';
import { StockAssets } from '@/services/stockDataTypes';

// Helper function to format date for the chart
const formatDateForChart = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Helper function to format date for display
const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}/${year}`;
};

interface SideBySideAssetsChartProps {
  data: StockAssets[];
  height?: number;
  width?: number;
  title?: string;
}

const SideBySideAssetsChart: React.FC<SideBySideAssetsChartProps> = ({
  data,
  height = 300,
  width = 600,
  title = 'Biểu đồ Tài sản',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any[]>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = [];
    }

    // Remove previous canvas if it exists
    if (canvasRef.current && canvasRef.current.parentNode) {
      canvasRef.current.parentNode.removeChild(canvasRef.current);
      canvasRef.current = null;
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

    // Sort data by date
    const sortedData = [...data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

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
        barSpacing: 50, // Wider spacing for better readability
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
        timeFormatter: (time) => {
          if (typeof time === 'object') {
            const date = new Date(time.year, time.month - 1, time.day);
            return formatDateForDisplay(date.toISOString());
          }
          return time.toString();
        },
      },
    });

    chartRef.current = chart;

    // Create a canvas for custom drawing of bars
    const canvas = document.createElement('canvas');
    canvas.width = containerWidth;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    chartContainerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

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

    // Add legend
    const legendElement = document.createElement('div');
    legendElement.style.position = 'absolute';
    legendElement.style.top = '10px';
    legendElement.style.right = '10px';
    legendElement.style.color = '#DDD';
    legendElement.style.fontSize = '12px';
    legendElement.style.display = 'flex';
    legendElement.style.gap = '10px';

    const ttsLegend = document.createElement('div');
    ttsLegend.innerHTML = '<span style="display:inline-block;width:10px;height:10px;background:#26a69a;margin-right:5px;"></span>TTS';

    const vcshLegend = document.createElement('div');
    vcshLegend.innerHTML = '<span style="display:inline-block;width:10px;height:10px;background:#42a5f5;margin-right:5px;"></span>VCSH';

    const tbTtsLegend = document.createElement('div');
    tbTtsLegend.innerHTML = '<span style="display:inline-block;width:10px;height:2px;background:#ef5350;margin-right:5px;vertical-align:middle;"></span>TB TTS Ngành';

    legendElement.appendChild(ttsLegend);
    legendElement.appendChild(vcshLegend);
    legendElement.appendChild(tbTtsLegend);

    chartContainerRef.current.appendChild(legendElement);

    // Create TB_TTS_NGANH line series
    const tbTtsNganhSeries = chart.addSeries(LineSeries, {
      color: '#ef5350',
      lineWidth: 2,
      title: 'TB TTS Ngành',
    });

    const tbTtsNganhData = sortedData
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

    // Create a hidden line series for TTS to get the scale right
    const ttsLineSeries = chart.addSeries(LineSeries, {
      color: 'rgba(0,0,0,0)', // Transparent
      lineWidth: 0,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const ttsData = sortedData
      .filter(item => item.tts !== undefined)
      .map(item => {
        const value = typeof item.tts === 'string' ? parseFloat(item.tts as string) : Number(item.tts);
        return {
          time: formatDateForChart(item.date),
          value,
        };
      });

    ttsLineSeries.setData(ttsData);

    // Create a hidden line series for VCSH to get the scale right
    const vcshLineSeries = chart.addSeries(LineSeries, {
      color: 'rgba(0,0,0,0)', // Transparent
      lineWidth: 0,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const vcshData = sortedData
      .filter(item => item.vcsh !== undefined)
      .map(item => {
        const value = typeof item.vcsh === 'string' ? parseFloat(item.vcsh as string) : Number(item.vcsh);
        return {
          time: formatDateForChart(item.date),
          value,
        };
      });

    vcshLineSeries.setData(vcshData);

    // Function to draw custom bars
    const drawBars = () => {
      if (!canvasRef.current || !chartRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw bars for each data point
      sortedData.forEach(item => {
        const time = formatDateForChart(item.date);
        const ttsValue = typeof item.tts === 'string' ? parseFloat(item.tts as string) : Number(item.tts || 0);
        const vcshValue = typeof item.vcsh === 'string' ? parseFloat(item.vcsh as string) : Number(item.vcsh || 0);

        // Convert time to coordinate
        const timeCoord = chartRef.current!.timeScale().timeToCoordinate(time as any);
        if (timeCoord === null) return;

        // Convert values to coordinates
        const ttsCoord = chartRef.current!.priceScale('right').priceToCoordinate(ttsValue);
        const vcshCoord = chartRef.current!.priceScale('right').priceToCoordinate(vcshValue);
        const zeroCoord = chartRef.current!.priceScale('right').priceToCoordinate(0);

        if (ttsCoord === null || vcshCoord === null || zeroCoord === null) return;

        // Bar width
        const barWidth = 15;

        // Draw TTS bar (green)
        ctx.fillStyle = '#26a69a';
        ctx.fillRect(
          timeCoord - barWidth - 2, // Position to the left of the time point
          ttsCoord,
          barWidth,
          zeroCoord - ttsCoord
        );

        // Draw VCSH bar (blue)
        ctx.fillStyle = '#42a5f5';
        ctx.fillRect(
          timeCoord + 2, // Position to the right of the time point
          vcshCoord,
          barWidth,
          zeroCoord - vcshCoord
        );
      });
    };

    // Draw bars initially
    drawBars();

    // Redraw bars when chart is resized or panned
    chart.timeScale().subscribeVisibleTimeRangeChange(drawBars);
    chart.priceScale('right').subscribePriceScaleChange(drawBars);

    // Fit content
    if (sortedData.length > 0) {
      const firstDate = formatDateForChart(sortedData[0].date);
      const lastDate = formatDateForChart(sortedData[sortedData.length - 1].date);
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

      // Find the original data point (before sorting) to get all fields
      const dataPoint = data.find(item => formatDateForChart(item.date) === dateStr);

      if (!dataPoint) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      // Format tooltip content
      let tooltipContent = '';

      // Date formatting
      const date = new Date(dataPoint.date);
      const formattedDate = formatDateForDisplay(dataPoint.date);
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

    // Handle window resize
    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current || !canvasRef.current) return;

      const newWidth = chartContainerRef.current.clientWidth;

      // Resize chart
      chartRef.current.resize(newWidth, height);

      // Resize canvas
      canvasRef.current.width = newWidth;
      canvasRef.current.height = height;

      // Redraw bars
      drawBars();

      // Re-apply time scale range
      chartRef.current.timeScale().fitContent();
    };

    window.addEventListener('resize', handleResize);

    // Call resize initially to set the correct width
    const timer = setTimeout(handleResize, 50);

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);

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

      // Remove canvas element
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [data, height, width, title]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default SideBySideAssetsChart;
