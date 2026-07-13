import { Controller, Post, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class OrdersController{
    constructor(private readonly ordersService: OrdersService){}

    @Post()
    async createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto){
        return this.ordersService.createOrder(user.id, dto);

    }

    @Get()
    async getUserOrders(@CurrentUser() user: User) {
        return this.ordersService.getUserOrders(user.id);
    }

    @Get(':id')
    async getOrderById(@Param('id') id: string, @CurrentUser() user: User) {
        return this.ordersService.getOrderById(id, user.id);
    }

    @Patch(':id/cancel')
    async cancelOrder(@Param('id') id: string, @CurrentUser() user: User) {
        return this.ordersService.cancelOrder(id, user.id);
    }

}