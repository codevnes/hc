import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  thumbnail?: string;
  thumbnail_alt?: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  user_id: number;
  username: string;
  user_avatar?: string;
  views?: number;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
}

// Lấy tất cả bài viết
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy bài viết:', error);
    return [];
  }
};

// Lấy bài viết theo ID
export const getPostById = async (id: number | string): Promise<Post | null> => {
  try {
    const response = await axios.get(`${API_URL}/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy bài viết với ID ${id}:`, error);
    return null;
  }
};

// Lấy bài viết theo slug
export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  try {
    const response = await axios.get(`${API_URL}/posts/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy bài viết với slug ${slug}:`, error);
    return null;
  }
};

// Lấy bài viết theo danh mục
export const getPostsByCategory = async (categoryId: number | string): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_URL}/posts/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy bài viết theo danh mục ${categoryId}:`, error);
    return [];
  }
};

// Lấy bài viết theo slug của danh mục
export const getPostsByCategorySlug = async (categorySlug: string): Promise<Post[]> => {
  try {
    const response = await axios.get(`${API_URL}/posts/category/slug/${categorySlug}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy bài viết theo danh mục slug ${categorySlug}:`, error);
    return [];
  }
};

// Lấy tất cả danh mục
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return [];
  }
};

// Lấy danh mục theo slug
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const response = await axios.get(`${API_URL}/categories/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh mục với slug ${slug}:`, error);
    return null;
  }
};

/**
 * Lấy bài viết theo slug của danh mục và slug của bài viết
 */
export async function getPostByCategoryAndSlug(categorySlug: string, postSlug: string): Promise<Post | null> {
  try {
    // TODO: Thay thế bằng API call thực tế
    // const response = await fetch(`/api/posts/${categorySlug}/${postSlug}`);
    // if (!response.ok) return null;
    // return await response.json();
    
    // Dữ liệu mẫu
    return {
      id: 1,
      title: 'Phân tích xu hướng thị trường chứng khoán tháng 7/2023',
      slug: postSlug,
      content: `<p>Thị trường chứng khoán trong tháng 7/2023 đã chứng kiến nhiều biến động đáng chú ý. VN-Index đã có những phiên giao dịch tích cực với khối lượng giao dịch tăng mạnh.</p>
      <h2>Diễn biến thị trường</h2>
      <p>Trong tháng 7, VN-Index đã có sự phục hồi đáng kể với mức tăng khoảng 5,2%, đóng cửa ở mức 1.230 điểm vào cuối tháng. Thanh khoản thị trường cũng cải thiện với giá trị giao dịch bình quân đạt khoảng 15.000 tỷ đồng mỗi phiên, tăng 20% so với tháng trước.</p>
      <p>Các nhóm cổ phiếu dẫn dắt thị trường bao gồm:</p>
      <ul>
        <li>Ngân hàng: VCB, BID, CTG</li>
        <li>Bất động sản: VIC, VHM, NVL</li>
        <li>Chứng khoán: SSI, VND, HCM</li>
      </ul>
      <h2>Yếu tố vĩ mô</h2>
      <p>Lạm phát trong tháng 7 được kiểm soát ở mức 3,1%, thấp hơn dự báo của các chuyên gia. Lãi suất liên ngân hàng cũng giảm nhẹ, tạo điều kiện thuận lợi cho dòng tiền vào thị trường chứng khoán.</p>
      <p>Tỷ giá USD/VND tương đối ổn định, giúp giảm áp lực lên chính sách tiền tệ và hỗ trợ tâm lý nhà đầu tư.</p>
      <h2>Dự báo tháng 8</h2>
      <p>Với kết quả kinh doanh quý 2 của các doanh nghiệp niêm yết đang dần được công bố, thị trường có thể sẽ tiếp tục phân hóa mạnh. Các cổ phiếu có kết quả tích cực sẽ thu hút dòng tiền, trong khi những doanh nghiệp có kết quả kém khả quan có thể chịu áp lực điều chỉnh.</p>
      <p>Nhà đầu tư nên theo dõi chặt chẽ các thông tin vĩ mô và kết quả kinh doanh để có chiến lược đầu tư phù hợp trong giai đoạn tới.</p>`,
      created_at: '2023-07-30T09:30:00Z',
      updated_at: '2023-07-30T10:15:00Z',
      category_id: 2,
      category_name: 'Phân tích thị trường',
      category_slug: categorySlug,
      user_id: 1,
      username: 'Admin',
      user_avatar: '/images/avatars/admin.jpg',
      views: 1250,
      tags: ['chứng khoán', 'phân tích kỹ thuật', 'VN-Index'],
      status: 'published'
    };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Lấy các bài viết liên quan
 */
export async function getRelatedPosts(postId: number, categoryId: number): Promise<Post[]> {
  try {
    // TODO: Thay thế bằng API call thực tế
    // const response = await fetch(`/api/posts/related?postId=${postId}&categoryId=${categoryId}`);
    // if (!response.ok) return [];
    // return await response.json();
    
    // Dữ liệu mẫu
    return [
      {
        id: 2,
        title: 'Top 5 cổ phiếu ngành ngân hàng đáng chú ý trong quý 3/2023',
        slug: 'top-5-co-phieu-nganh-ngan-hang-dang-chu-y-trong-quy-3-2023',
        content: '<p>Ngành ngân hàng đang cho thấy nhiều tín hiệu tích cực trong quý 3/2023...</p>',
        excerpt: 'Ngành ngân hàng đang cho thấy nhiều tín hiệu tích cực trong quý 3/2023...',
        thumbnail: '/images/posts/bank-stocks.jpg',
        created_at: '2023-07-25T14:20:00Z',
        updated_at: '2023-07-25T14:20:00Z',
        category_id: 2,
        category_name: 'Phân tích thị trường',
        category_slug: 'phan-tich-thi-truong',
        user_id: 2,
        username: 'Analyst',
        views: 985,
        status: 'published'
      },
      {
        id: 3,
        title: 'Chiến lược đầu tư chứng khoán trong thời kỳ biến động',
        slug: 'chien-luoc-dau-tu-chung-khoan-trong-thoi-ky-bien-dong',
        content: '<p>Thị trường chứng khoán luôn có những biến động khó lường, đặc biệt trong giai đoạn hiện tại...</p>',
        excerpt: 'Thị trường chứng khoán luôn có những biến động khó lường, đặc biệt trong giai đoạn hiện tại...',
        thumbnail: '/images/posts/investment-strategy.jpg',
        created_at: '2023-07-18T10:15:00Z',
        updated_at: '2023-07-18T10:15:00Z',
        category_id: 3,
        category_name: 'Chiến lược đầu tư',
        category_slug: 'chien-luoc-dau-tu',
        user_id: 3,
        username: 'Investor',
        views: 1120,
        status: 'published'
      },
      {
        id: 4,
        title: 'Cập nhật tình hình kinh tế vĩ mô và tác động đến TTCK',
        slug: 'cap-nhat-tinh-hinh-kinh-te-vi-mo-va-tac-dong-den-ttck',
        content: '<p>Tình hình kinh tế vĩ mô đang có những chuyển biến tích cực với GDP quý 2 tăng 6,5%...</p>',
        excerpt: 'Tình hình kinh tế vĩ mô đang có những chuyển biến tích cực với GDP quý 2 tăng 6,5%...',
        thumbnail: '/images/posts/macro-economy.jpg',
        created_at: '2023-07-15T08:40:00Z',
        updated_at: '2023-07-15T08:40:00Z',
        category_id: 2,
        category_name: 'Phân tích thị trường',
        category_slug: 'phan-tich-thi-truong',
        user_id: 1,
        username: 'Admin',
        views: 1560,
        status: 'published'
      }
    ];
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
} 