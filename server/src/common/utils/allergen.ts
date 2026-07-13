export function getConflictingAllergens(
  itemAllergens: string[],
  userAllergens: string[],
): string[] {
  return itemAllergens.filter((a) => userAllergens.includes(a));
}
