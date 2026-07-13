export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  imageUrl?: string;
  healthRating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionInfo {
  id: string;
  menuItemId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  allergens: string[];
  servingSize?: string;
  fetchedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  priceRs: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  nutritionStatus: "FETCHED" | "PENDING" | "FAILED";
  createdAt: string;
  updatedAt: string;
  nutrition?: NutritionInfo;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "RESTAURANT_ADMIN" | "SUPER_ADMIN";
  isOnboardingComplete: boolean;
}

export interface HealthProfile {
  id: string;
  userId: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: "LOSE" | "MAINTAIN" | "GAIN";
  dietaryRestriction: "NONE" | "VEGETARIAN" | "VEGAN";
  allergens: string[];
  calorieTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPriceRs: number;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  totalPriceRs: number;
  totalCalories?: number;
  healthScoreAvg?: number;
  stripePaymentId?: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  restaurant?: Restaurant;
}