'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { StockAssets } from '@/services/stockDataTypes';

// Register all Chart.js components
Chart.register(...registerables);

// Helper function to format date for display
const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter}/${year}`;
};

interface ChartJsAssetsChartProps {
  data: StockAssets[];
  height?: number;
  width?: number;
  title?: string;
}

const ChartJsAssetsChart: React.FC<ChartJsAssetsChartProps> = ({
  data,
  height = 300,
  width = 600,
  title = 'Biểu đồ Tài sản',
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Sort data by date
    const sortedData = [...data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Prepare data for Chart.js
    const labels = sortedData.map(item => formatDateForDisplay(item.date));

    const ttsData = sortedData.map(item => {
      const value = typeof item.tts === 'string' ? parseFloat(item.tts as string) : Number(item.tts || 0);
      return value;
    });

    const vcshData = sortedData.map(item => {
      const value = typeof item.vcsh === 'string' ? parseFloat(item.vcsh as string) : Number(item.vcsh || 0);
      return value;
    });

    const tbTtsNganhData = sortedData.map(item => {
      const value = typeof item.tb_tts_nganh === 'string'
        ? parseFloat(item.tb_tts_nganh as string)
        : Number(item.tb_tts_nganh || 0);
      return value;
    });

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'TTS',
            data: ttsData,
            backgroundColor: '#26a69a',
            borderColor: '#26a69a',
            borderWidth: 1,
            // This ensures the bars are side by side
            order: 1
          },
          {
            label: 'VCSH',
            data: vcshData,
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            borderWidth: 1,
            // This ensures the bars are side by side
            order: 2
          },
          {
            label: 'TB TTS Ngành',
            data: tbTtsNganhData,
            type: 'line',
            borderColor: '#ef5350',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointBackgroundColor: '#ef5350',
            pointBorderColor: '#ef5350',
            pointRadius: 3,
            // This ensures the line is drawn on top of the bars
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // This ensures the bars are displayed side by side
        barPercentage: 0.6,
        categoryPercentage: 0.8,

        plugins: {
          title: {
            display: !!title,
            text: title,
            color: '#DDD',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 10
            }
          },
          legend: {
            position: 'top',
            labels: {
              color: '#DDD',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(30, 30, 40, 0.9)',
            titleColor: '#DDD',
            bodyColor: '#DDD',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            backgroundColor: 'oklch(.21 .034 264.665)',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#DDD'
            },
            // This ensures the bars are grouped by label
            stacked: false
          },
          y: {
            backgroundColor: 'oklch(.21 .034 264.665)',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#DDD',
              callback: function(value) {
                return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value));
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 500
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 0,
            bottom: 0
          }
        }
      }
    });

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, title]);

  return (
    <div className="relative w-full rounded-md overflow-hidden" style={{ height: `${height}px`, backgroundColor: 'oklch(.21 .034 264.665)' }}>
      <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ChartJsAssetsChart;
