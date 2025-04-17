'use client';

import React from 'react';
import Link from 'next/link';
import { Stock } from '@/services/stockService';

interface LatestArticlesProps {
  stocks: Stock[];
  showContainer?: boolean;
  title?: string;
}

const LatestArticles: React.FC<LatestArticlesProps> = ({
  stocks,
  showContainer = false,
  title = 'Bài viết mới nhất'
}) => {
  const content = (
    <>
      {showContainer && (
        <h2 className="text-xl font-semibold mb-4 dark:text-dark-text">{title}</h2>
      )}

      {stocks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
      ) : (
        <div className="space-y-4">
          {stocks.map((stock, index) => (
            <div
              key={`${stock.symbol}-${stock.date}`}
              className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium dark:text-dark-text">{stock.symbol}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(stock.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${stock.qv1 && stock.qv1 > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stock.qv1?.toLocaleString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">QV1</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-right">
        <Link
          href="/dashboard/stocks"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          Xem tất cả
        </Link>
      </div>
    </>
  );

  if (showContainer) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-lg shadow dark:shadow-gray-800 p-6">
        {content}
      </div>
    );
  }

  return content;
};

export default LatestArticles;
