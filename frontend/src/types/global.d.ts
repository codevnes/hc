import { IChartApi } from 'lightweight-charts';

declare global {
  interface Window {
    chartSyncRegistry?: {
      [key: string]: IChartApi[];
    };
  }
}

export {};
