// Interface cho dữ liệu stock_daily
export interface StockDaily {
  id?: number;
  symbol: string;
  date: string;
  close_price: number;
  return_value?: number;
  kldd?: number;
  von_hoa?: number;
  pe?: number;
  roa?: number;
  roe?: number;
  eps?: number;
  stock_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho dữ liệu stock_assets
export interface StockAssets {
  id?: number;
  symbol: string;
  date: string;
  tts?: number;
  vcsh?: number;
  tb_tts_nganh?: number;
  stock_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho dữ liệu stock_metrics
export interface StockMetrics {
  id?: number;
  symbol: string;
  date: string;
  roa?: number;
  roe?: number;
  tb_roa_nganh?: number;
  tb_roe_nganh?: number;
  stock_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho dữ liệu stock_eps
export interface StockEPS {
  id?: number;
  symbol: string;
  date: string;
  eps?: number;
  eps_nganh?: number;
  stock_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho dữ liệu stock_pe
export interface StockPE {
  id?: number;
  symbol: string;
  date: string;
  pe?: number;
  pe_nganh?: number;
  stock_name?: string;
  created_at?: string;
  updated_at?: string;
}
