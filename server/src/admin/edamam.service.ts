import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import axios from 'axios';


@Injectable()
export class EdamamService {
    private readonly logger = new Logger(EdamamService.name);
    private readonly appId = process.env.EDAMAM_APP_ID || 'demo';
    private readonly appKey = process.env.EDAMAM_APP_KEY || 'demo';
    private readonly baseUrl = 'https://api.edamam.com/api/food-database/v2/parser';

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async fetchNutrition(menuItemId: string, itemName: string){
        try {
            const cacheKey = `nutrition:item:${menuItemId}`;
            const cached = await this.cacheManager.get(cacheKey);
            if(cached){
                this.logger.log(`Using cached nutrition data for item ${menuItemId}`);
                return cached;
            }

            this.logger.log(`Fetching nutrition data for ${itemName}`);
            const response = await axios.get(this.baseUrl, {
                params: {
                    ingr: itemName,
                    app_id: this.appId,
                    app_key: this.appKey,
                },
            });

            const parsed = this.parseEdamamResponse(response.data);
            await this.cacheManager.set(cacheKey, parsed, 30 * 24 * 60 * 60 * 1000);
            return parsed;

        } catch (error: any) {
            this.logger.error(`Failed to fetch nutrition data: ${error.message}`);
            return null;
        }
    }

    private parseEdamamResponse(data: any){
        if(!data.parsed || data.parsed.length === 0)
            return null;

        const food = data.hints[0].food;
        const nutrients = food.nutrients;

        return {
            calories: Math.round(nutrients.ENERC_KCAL || 0),
            proteinG: parseFloat((nutrients.PROCNT || 0).toFixed(2)),
            carbsG: parseFloat((nutrients.CHOCDF || 0).toFixed(2)),
            fatG: parseFloat((nutrients.FAT || 0).toFixed(2)),
            fiberG: parseFloat((nutrients.FIBTG || 0).toFixed(2)),
            allergens: [],
            servingSize: food.servingSize || '100g',
        };
    }
}