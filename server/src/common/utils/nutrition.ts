import { HealthProfile } from '@prisma/client';

export interface NutritionInfoInput {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export function calculateHealthScore(
  nutrition: NutritionInfoInput,
  profile: HealthProfile,
): number {
  let score = 100;

  const caloriePct = nutrition.calories / profile.calorieTarget;
  if (caloriePct > 0.5)
    score -= 30; // >50% of daily target in one item
  else if (caloriePct > 0.35) score -= 15;
  else if (caloriePct > 0.2) score -= 5;

  // 2. Macro balance penalty based on goal
  const totalMacros = nutrition.proteinG + nutrition.carbsG + nutrition.fatG;
  if (totalMacros > 0) {
    const proteinRatio = nutrition.proteinG / totalMacros;
    const fatRatio = nutrition.fatG / totalMacros;

    if (profile.goal === 'LOSE') {
      if (fatRatio > 0.4) score -= 20;
      if (proteinRatio < 0.2) score -= 10;
    }
    if (profile.goal === 'GAIN') {
      if (proteinRatio < 0.25) score -= 15;
    }
    if (profile.goal === 'MAINTAIN') {
      if (fatRatio > 0.45) score -= 10;
    }
  }

  // 3. Fiber bonus
  if (nutrition.fiberG >= 5) score += 5;
  else if (nutrition.fiberG >= 3) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getConflictingAllergens(
  itemAllergens: string[],
  userAllergens: string[],
): string[] {
  return itemAllergens.filter(allergen =>
    userAllergens.includes(allergen),
  );
}
