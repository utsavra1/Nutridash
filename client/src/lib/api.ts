import axios from "axios";
import { Restaurant, MenuItem, User, HealthProfile, Order } from "../types";
import { useAuthStore } from "../stores/auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  withCredentials: true,
});

// Add access token to requests
api.interceptors.request.use(
  (config) => {
    const { accessToken, hasHydrated } = useAuthStore.getState();
    console.log("🔑 API Request - Access Token:", accessToken ? "exists" : "missing");
    console.log("🔄 Auth Store Hydrated:", hasHydrated);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("🔑 Adding Authorization header");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ Full error object:", error);
    if (error.response) {
      console.error("❌ API Error Status:", error.response.status);
      console.error("❌ API Error Headers:", error.response.headers);
      console.error("❌ API Error Data:", error.response.data);
      const code = error.response.data?.code;
      switch (code) {
        case "ONBOARDING_INCOMPLETE":
          console.error(code);
          break;
        case "ITEM_UNAVAILABLE":
          console.error(code);
          break;
        case "STRIPE_PAYMENT_FAILED":
          console.error(code);
          break;
        case "VALIDATION_ERROR":
          console.error(code);
          break;
        case "UNAUTHORIZED":
          {
            const { accessToken, hasHydrated, logout } = useAuthStore.getState();
            if (hasHydrated && accessToken) {
              logout();
            }
          }
          console.error(code);
          break;
        case "FORBIDDEN":
          console.error(code);
          break;
        case "NOT_FOUND":
          console.error(code);
          break;
        default:
          console.error("Unknown API error:", error.response.data);
      }
    } else if (error.request) {
      console.error("❌ Network Error: No response received:", error.request);
    } else {
      console.error("❌ Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  sendOtp: async (email: string) => {
    const response = await api.post<{ message: string }>("/auth/send-otp", { email });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return response.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<{ message: string }>("/auth/reset-password", data);
    return response.data;
  },
  register: async (data: { email: string; password: string; name: string; otp: string }) => {
    console.log("📝 Registering user with data:", { ...data, password: "***" });
    const response = await api.post<{ user: User; accessToken: string }>("/auth/register", data);
    console.log("✅ Register response:", response.data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    console.log("🔑 Logging in user with data:", data);
    const response = await api.post<{ user: User; accessToken: string }>("/auth/login", data);
    console.log("✅ Login response:", response.data);
    return response.data;
  },
  logout: async () => {
    await api.post("/auth/logout");
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.patch<{ message: string }>("/auth/change-password", data);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getMe: async () => {
    const response = await api.get<User>("/users/me");
    return response.data;
  },
  updateMe: async (data: { name: string }) => {
    const response = await api.patch<User>("/users/me", data);
    return response.data;
  },
  getHealthProfile: async () => {
    const response = await api.get<HealthProfile>("/users/me/health-profile");
    return response.data;
  },
  createHealthProfile: async (data: Omit<HealthProfile, "id" | "userId" | "createdAt" | "updatedAt">) => {
    console.log("🏥 Creating health profile with data:", data);
    const response = await api.post<HealthProfile>("/users/me/health-profile", data);
    console.log("✅ Health profile created:", response.data);
    return response.data;
  },
  updateHealthProfile: async (data: Partial<Omit<HealthProfile, "id" | "userId" | "createdAt" | "updatedAt">>) => {
    const response = await api.patch<HealthProfile>("/users/me/health-profile", data);
    return response.data;
  },
};

// Restaurants API
export const restaurantsApi = {
  getAll: async (cuisine?: string) => {
    const params = cuisine ? { cuisine } : {};
    const response = await api.get<Restaurant[]>("/restaurants", { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Restaurant>(`/restaurants/${id}`);
    return response.data;
  },
  getMenu: async (id: string) => {
    const response = await api.get<MenuItem[]>(`/restaurants/${id}/menu`);
    return response.data;
  },
};

// Nutrition API
export const nutritionApi = {
  getHealthScore: async (menuItemId: string) => {
    const response = await api.get<{ score: number | null }>("/nutrition/score", {
      params: { menuItemId },
    });
    return response.data;
  },
  getAlternatives: async (menuItemId: string) => {
    const response = await api.get<{
      alternatives: Array<{ item: MenuItem; score: number }>;
    }>("/nutrition/alternatives", {
      params: { menuItemId },
    });
    return response.data;
  },
  getDashboard: async () => {
    const response = await api.get<{
      dailyData: Array<{
        date: string;
        totalCalories: number;
        totalProteinG: number;
        totalCarbsG: number;
        totalFatG: number;
        totalFiberG: number;
        healthScoreAvg: number;
      }>;
      totalCalories: number;
      totalProteinG: number;
      totalCarbsG: number;
      totalFatG: number;
    }>("/nutrition/dashboard");
    return response.data;
  },
};

export const ordersApi = {
  createPaymentIntent: async (data: {
    items: Array<{ menuItemId: string; quantity: number }>;
    deliveryAddress: string;
  }) => {
    const response = await api.post("/orders/payment-intent", data);
    return response.data;
  },
  createOrder: async (data: {
    items: Array<{ menuItemId: string; quantity: number }>;
    deliveryAddress: string;
    paymentIntentId?: string;
  }) => {
    const response = await api.post<Order>("/orders", data);
    return response.data;
  },

  getMyOrders: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<{
      orders: Order[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>('/orders', {
      params: { page, limit },
    });
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },
  cancelOrder: async (id: string) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },
}

// Admin API
export const adminApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/admin/menu-items/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },
  getMenuItems: async () => {
    const response = await api.get<MenuItem[]>('/admin/menu-items');
    return response.data;
  },
  createMenuItem: async (data: {
    name: string;
    description?: string;
    priceRs: number;
    category: string;
    imageUrl?: string;
    isAvailable?: boolean;
  }) => {
    const response = await api.post<MenuItem>('/admin/menu-items', data);
    return response.data;
  },
  updateMenuItem: async (id: string, data: Partial<{
    name: string;
    description?: string;
    priceRs: number;
    category: string;
    imageUrl?: string;
    isAvailable?: boolean;
  }>) => {
    const response = await api.patch<MenuItem>(`/admin/menu-items/${id}`, data);
    return response.data;
  },
  deleteMenuItem: async (id: string) => {
    const response = await api.delete(`/admin/menu-items/${id}`);
    return response.data;
  },
  refetchNutrition: async (id: string) => {
    const response = await api.post<MenuItem>(`/admin/menu-items/${id}/refetch-nutrition`);
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get<{
      totalMenuItems: number;
      todayOrders: number;
      avgHealthScore: number;
    }>('/admin/menu-items/dashboard/stats');
    return response.data;
  },
}

// Super Admin API
export const superAdminApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/super-admin/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },
  getRestaurants: async () => {
    const response = await api.get<Restaurant[]>('/super-admin/restaurants');
    return response.data;
  },
  createRestaurant: async (data: {
    name: string;
    cuisine: string;
    address: string;
    imageUrl?: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }) => {
    const response = await api.post<Restaurant>('/super-admin/restaurants', data);
    return response.data;
  },
  updateRestaurant: async (id: string, data: Partial<{
    name: string;
    cuisine: string;
    address: string;
    imageUrl?: string;
    isActive?: boolean;
  }>) => {
    const response = await api.patch<Restaurant>(`/super-admin/restaurants/${id}`, data);
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get<User[]>('/super-admin/users');
    return response.data;
  },
  updateUser: async (id: string, data: { isSuspended?: boolean }) => {
    const response = await api.patch<User>(`/super-admin/users/${id}`, data);
    return response.data;
  },
  getOrders: async (filters?: { restaurantId?: string; status?: string }) => {
    const params: any = {};
    if (filters?.restaurantId) params.restaurantId = filters.restaurantId;
    if (filters?.status) params.status = filters.status;
    const response = await api.get<Order[]>('/super-admin/orders', { params });
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get<{
      totalRestaurants: number;
      totalUsers: number;
      todayOrders: number;
      activeRestaurants: number;
    }>('/super-admin/dashboard/stats');
    return response.data;
  },
}

export default api;
