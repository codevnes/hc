'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { StockMetrics } from '@/services/stockDataTypes';

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

interface MetricsChartProps {
  data: StockMetrics[];
  height?: number;
  width?: number;
  title?: string;
}

const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  height = 300,
  width = 600,
  title = 'Biểu đồ ROA/ROE',
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

    const roaData = sortedData.map(item => {
      const value = typeof item.roa === 'string' ? parseFloat(item.roa as string) : Number(item.roa || 0);
      return value;
    });

    const roeData = sortedData.map(item => {
      const value = typeof item.roe === 'string' ? parseFloat(item.roe as string) : Number(item.roe || 0);
      return value;
    });

    const tbRoaNganhData = sortedData.map(item => {
      const value = typeof item.tb_roa_nganh === 'string'
        ? parseFloat(item.tb_roa_nganh as string)
        : Number(item.tb_roa_nganh || 0);
      return value;
    });

    const tbRoeNganhData = sortedData.map(item => {
      const value = typeof item.tb_roe_nganh === 'string'
        ? parseFloat(item.tb_roe_nganh as string)
        : Number(item.tb_roe_nganh || 0);
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
            label: 'ROA',
            data: roaData,
            backgroundColor: '#26a69a',
            borderColor: '#26a69a',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
            order: 1
          },
          {
            label: 'ROE',
            data: roeData,
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
            order: 2
          },
          {
            label: 'TB ROA Ngành',
            data: tbRoaNganhData,
            type: 'line',
            borderColor: '#ef5350',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.1,
            pointBackgroundColor: '#ef5350',
            pointBorderColor: '#ef5350',
            pointRadius: 3,
            fill: false,
            order: 0
          },
          {
            label: 'TB ROE Ngành',
            data: tbRoeNganhData,
            type: 'line',
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.1,
            pointBackgroundColor: '#ff9800',
            pointBorderColor: '#ff9800',
            pointRadius: 3,
            fill: false,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: 'oklch(.21 .034 264.665)',
        // This ensures the bars are displayed side by side
        barPercentage: 0.8,
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
                  label += new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(context.parsed.y) + '%';
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
            }
          },
          y: {
            backgroundColor: 'oklch(.21 .034 264.665)',
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#DDD',
              callback: function(value) {
                return value + '%';
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

export default MetricsChart;
