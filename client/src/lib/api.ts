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
    const accessToken = useAuthStore.getState().accessToken;
    console.log("🔑 API Request - Access Token:", accessToken ? "exists" : "missing");
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
    console.error("❌ API Error:", error.response?.data);
    const code = error.response?.data?.code;
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
        useAuthStore.getState().logout();
        console.error(code);
        break;
      case "FORBIDDEN":
        console.error(code);
        break;
      case "NOT_FOUND":
        console.error(code);
        break;
      default:
        console.error("Unknown error:", error);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    console.log("📝 Registering user with data:", data);
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
  createOrder: async (data: {items: Array<{menuItemId: string; quantity: number}>;
  deliveryAddress: string}) => {
    const response = await api.post<Order>("/orders", data);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get<Order[]>('/orders');
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
}

// Super Admin API
export const superAdminApi = {
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
}

export default api;