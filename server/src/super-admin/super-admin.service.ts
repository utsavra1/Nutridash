import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SuperAdminRepository } from './super-admin.repository';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
    constructor(private superAdminRepo: SuperAdminRepository){}


    async createRestaurant(dto: CreateRestaurantDto){
        const existingRestaurant = await this.superAdminRepo.getRestaurantByName(dto.name); // FIXED
        if(existingRestaurant){
            throw new ConflictException('Restaurant name already exists');
        }

        const existingUser = await this.superAdminRepo.getUserByEmail(dto.adminEmail); // FIXED
        if(existingUser){
            throw new ConflictException('Admin email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);


        const restaurant = await this.superAdminRepo.createRestaurant({
            name: dto.name,
            cuisine: dto.cuisine,
            address: dto.address,
            imageUrl: dto.imageUrl,
        });

        await this.superAdminRepo.createRestaurantAdmin({
            email: dto.adminEmail,
            passwordHash: hashedPassword,
            name: dto.adminName,
            role: 'RESTAURANT_ADMIN',
            restaurantId: restaurant.id,
            isOnboardingComplete: true,
        });

        return this.superAdminRepo.getRestaurantById(restaurant.id);
    }

    async getRestaurants() {
        return this.superAdminRepo.getRestaurants();
    }

    async getRestaurantById(id: string) {
      const restaurant = await this.superAdminRepo.getRestaurantById(id);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
      return restaurant;
    }

    async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
      const restaurant = await this.superAdminRepo.getRestaurantById(id);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
      return this.superAdminRepo.updateRestaurant(id, dto);
    }

    async getUsers() {
      return this.superAdminRepo.getUsers();
    }

    async getUserById(id: string) {
      const user = await this.superAdminRepo.getUserById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }

    async updateUser(id: string, dto: UpdateUserDto) {
      const user = await this.superAdminRepo.getUserById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.superAdminRepo.updateUser(id, dto);
    }

    async getAllOrders(filter?: { restaurantId?: string; status?: string}){
      if(filter?.restaurantId ){
          return this.superAdminRepo.getOrdersByRestaurant(filter.restaurantId);
      }

      if(filter?.status){
          return this.superAdminRepo.getOrdersByStatus(filter.status);
      }
      return this.superAdminRepo.getAllOrders();
    }
} 