import axios from 'axios';
import { StockPE } from './stockDataTypes';

const API_URL = 'http://localhost:5000/api';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

// Lấy tất cả stock_pe
export const getAllStockPE = async (limit = 100, offset = 0) => {
  const response = await axios.get(`${API_URL}/stock-pe?limit=${limit}&offset=${offset}`, getHeaders());
  return response.data;
};

// Lấy stock_pe theo symbol
export const getStockPEBySymbol = async (symbol: string) => {
  const response = await axios.get(`${API_URL}/stock-pe/symbol/${symbol}`, getHeaders());
  return response.data;
};

// Lấy stock_pe theo date
export const getStockPEByDate = async (date: string) => {
  const response = await axios.get(`${API_URL}/stock-pe/date/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_pe theo khoảng thời gian
export const getStockPEByDateRange = async (startDate: string, endDate: string, symbol?: string) => {
  let url = `${API_URL}/stock-pe/range?startDate=${startDate}&endDate=${endDate}`;
  if (symbol) {
    url += `&symbol=${symbol}`;
  }
  const response = await axios.get(url, getHeaders());
  return response.data;
};

// Lấy stock_pe theo symbol và date
export const getStockPEBySymbolAndDate = async (symbol: string, date: string) => {
  const response = await axios.get(`${API_URL}/stock-pe/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_pe theo ID
export const getStockPEById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/stock-pe/id/${id}`, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Không tìm thấy stock_pe với ID ${id}`);
    }
    throw error;
  }
};

// Tạo stock_pe mới (admin only)
export const createStockPE = async (stockPEData: StockPE) => {
  const response = await axios.post(`${API_URL}/stock-pe`, stockPEData, getHeaders());
  return response.data;
};

// Cập nhật stock_pe (admin only)
export const updateStockPE = async (symbol: string, date: string, stockPEData: Partial<StockPE>) => {
  const response = await axios.put(`${API_URL}/stock-pe/${symbol}/${date}`, stockPEData, getHeaders());
  return response.data;
};

// Cập nhật stock_pe theo ID (admin only)
export const updateStockPEById = async (id: number, stockPEData: Partial<StockPE>) => {
  try {
    const response = await axios.put(`${API_URL}/stock-pe/id/${id}`, stockPEData, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Không tìm thấy stock_pe với ID ${id} để cập nhật`);
    }
    throw error;
  }
};

// Xóa stock_pe (admin only)
export const deleteStockPE = async (symbol: string, date: string) => {
  const response = await axios.delete(`${API_URL}/stock-pe/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Xóa stock_pe theo ID (admin only)
export const deleteStockPEById = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/stock-pe/id/${id}`, getHeaders());
    return response.data;
  } catch (error: any) {
    // Nếu lỗi là không tìm thấy dữ liệu, ghi nhật ký lỗi
    if (error.response?.data?.message === 'Không tìm thấy dữ liệu stock_pe' || error.response?.status === 404) {
      console.warn(`Không tìm thấy stock_pe với ID ${id} để xóa`);
    }
    throw error;
  }
};

// Xóa nhiều stock_pe (admin only)
export const deleteMultipleStockPE = async (items: { symbol: string; date: string }[]) => {
  const response = await axios.delete(`${API_URL}/stock-pe`, {
    ...getHeaders(),
    data: { items }
  });
  return response.data;
};

// Xóa nhiều stock_pe theo ID (admin only)
export const deleteMultipleStockPEByIds = async (ids: number[]) => {
  try {
    const response = await axios.delete(`${API_URL}/stock-pe/bulk-delete`, {
      ...getHeaders(),
      data: { ids }
    });
    return response.data;
  } catch (error: any) {
    // Nếu endpoint không tồn tại (404), thì xử lý từng ID một
    if (error.response?.status === 404) {
      console.warn('Endpoint /stock-pe/bulk-delete không tồn tại, sẽ xóa từng ID một');
      // Xử lý xóa từng ID một
      const results = [];
      const errors = [];
      
      for (const id of ids) {
        try {
          const result = await deleteStockPEById(id);
          results.push(result);
        } catch (idError: any) {
          errors.push({ id, error: idError.message || 'Lỗi không xác định' });
        }
      }
      
      if (errors.length > 0) {
        console.error('Lỗi khi xóa một số ID:', errors);
        if (results.length > 0) {
          // Nếu có ít nhất một ID được xóa thành công
          return { 
            success: true, 
            message: `Đã xóa ${results.length}/${ids.length} mục, ${errors.length} mục không thành công`,
            results,
            errors 
          };
        }
        // Nếu không có ID nào được xóa thành công, ném lỗi
        throw new Error('Không thể xóa bất kỳ mục nào');
      }
      
      return { 
        success: true, 
        message: 'Đã xóa tất cả các mục thành công bằng phương thức xóa từng mục',
        results 
      };
    }
    
    // Kiểm tra nếu lỗi là "Không tìm thấy dữ liệu stock_pe"
    if (error.response?.data?.message === 'Không tìm thấy dữ liệu stock_pe') {
      console.warn('Một số ID không tồn tại, vẫn tiếp tục xóa các ID khác');
      // Vẫn trả về lỗi để UI có thể xử lý
    }
    throw error; // Ném lỗi để UI xử lý
  }
};

// Import stock_pe từ file CSV (admin only)
export const importStockPEFromCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/stock-pe/import`, formData, {
      headers: {
        'x-auth-token': getToken(),
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error: any) {
    // Kiểm tra lỗi định dạng ngày
    if (error.response?.data?.message && error.response.data.message.includes('invalid date format')) {
      throw new Error('File CSV chứa định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD.');
    }
    throw error;
  }
};

// Hàm hỗ trợ xác nhận định dạng CSV trước khi gửi
export const validateCSVBeforeImport = async (file: File): Promise<{isValid: boolean, errors: string[]}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const errors: string[] = [];
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        resolve({isValid: false, errors: ['Không thể đọc file']});
        return;
      }
      
      const csv = event.target.result as string;
      const lines = csv.split('\n');
      
      if (lines.length <= 1) {
        resolve({isValid: false, errors: ['File CSV trống hoặc chỉ có header']});
        return;
      }
      
      // Kiểm tra header
      const header = lines[0].trim().split(',');
      const requiredColumns = ['symbol', 'date', 'pe', 'pe_nganh'];
      
      for (const col of requiredColumns) {
        if (!header.includes(col)) {
          errors.push(`Thiếu cột ${col} trong file CSV`);
        }
      }
      
      // Kiểm tra từng dòng dữ liệu
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Bỏ qua dòng trống
        
        const parts = line.split(',');
        if (parts.length !== header.length) {
          errors.push(`Dòng ${i+1} có số cột không khớp với header`);
          continue;
        }
        
        // Tạo đối tượng dữ liệu từ dòng CSV
        const rowData: Record<string, string> = {};
        header.forEach((col, index) => {
          rowData[col] = parts[index];
        });
        
        // Kiểm tra định dạng ngày và chuẩn hóa
        if (rowData.date) {
          // Lấy giá trị ngày từ chuỗi date trong CSV
          let dateValue = rowData.date.trim();
          
          // Kiểm tra các định dạng phổ biến và chuyển đổi sang YYYY-MM-DD
          // Case 1: DD/MM/YYYY
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
            const dateParts = dateValue.split('/');
            dateValue = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
          // Case 2: MM/DD/YYYY
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue) && parseInt(dateValue.split('/')[0]) <= 12) {
            const dateParts = dateValue.split('/');
            dateValue = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
          }
          // Case 3: YYYY/MM/DD
          else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateValue)) {
            const dateParts = dateValue.split('/');
            dateValue = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
          }
          // Case 4: DD-MM-YYYY
          else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateValue)) {
            const dateParts = dateValue.split('-');
            dateValue = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
          
          // Kiểm tra định dạng cuối cùng có đúng là YYYY-MM-DD không
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(dateValue)) {
            errors.push(`Dòng ${i+1} có định dạng ngày không hợp lệ: ${rowData.date}. Vui lòng sử dụng định dạng YYYY-MM-DD hoặc DD/MM/YYYY.`);
          } else {
            // Kiểm tra tính hợp lệ của ngày
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              errors.push(`Dòng ${i+1} có ngày không hợp lệ: ${rowData.date} -> ${dateValue}`);
            } else {
              // Gán lại giá trị đã chuẩn hóa
              rowData.date = dateValue;
            }
          }
        } else {
          errors.push(`Dòng ${i+1} thiếu thông tin ngày`);
        }
        
        // Kiểm tra symbol
        if (!rowData.symbol) {
          errors.push(`Dòng ${i+1} thiếu mã cổ phiếu`);
        }
        
        // Kiểm tra pe và pe_nganh là số
        if (rowData.pe && isNaN(Number(rowData.pe))) {
          errors.push(`Dòng ${i+1} có giá trị PE không phải là số: ${rowData.pe}`);
        }
        
        if (rowData.pe_nganh && isNaN(Number(rowData.pe_nganh))) {
          errors.push(`Dòng ${i+1} có giá trị PE ngành không phải là số: ${rowData.pe_nganh}`);
        }
      }
      
      resolve({
        isValid: errors.length === 0,
        errors
      });
    };
    
    reader.onerror = () => {
      resolve({isValid: false, errors: ['Lỗi khi đọc file']});
    };
    
    reader.readAsText(file);
  });
};
