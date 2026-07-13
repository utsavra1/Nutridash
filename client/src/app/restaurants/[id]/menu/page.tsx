"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, HealthProfile } from "../../../../types";
import { Card } from "../../../../components/Card";
import { NutritionCard } from "../../../../components/NutritionCard";
import { HealthScoreBadge } from "../../../../components/HealthScoreBadge";
import { AllergenWarning } from "../../../../components/AllergenWarning";
import { AlternativesSuggestion } from "../../../../components/AlternativesSuggestion";
import {
  restaurantsApi,
  nutritionApi,
  usersApi,
} from "../../../../lib/api";
import { useCartStore } from "../../../../stores/cart-store";
import styles from "./page.module.css";

function MenuItemWithScore({
  item,
  healthProfile,
}: {
  item: MenuItem;
  healthProfile: HealthProfile | undefined;
}) {
  const [showAllergenWarning, setShowAllergenWarning] = useState(false);
  const [conflictingAllergens, setConflictingAllergens] = useState<string[]>([]);
  const { addItem } = useCartStore();

  const { data: scoreData } = useQuery({
    queryKey: ["healthScore", item.id],
    queryFn: () => nutritionApi.getHealthScore(item.id),
    enabled: !!item.nutrition,
  });

  const { data: alternativesData } = useQuery({
    queryKey: ["alternatives", item.id],
    queryFn: () => nutritionApi.getAlternatives(item.id),
    enabled: !!item.nutrition && (scoreData?.score ?? 100) < 50,
  });

  const handleAddToCart = () => {
    if (healthProfile && item.nutrition) {
      const conflicts = item.nutrition.allergens.filter((a) =>
        healthProfile.allergens.includes(a)
      );
      if (conflicts.length > 0) {
        setConflictingAllergens(conflicts);
        setShowAllergenWarning(true);
        return;
      }
    }
    addItem(item, scoreData?.score);
  };

  return (
    <Card key={item.id} className={styles.menuItemCard}>
      <div className={styles.itemHeader}>
        <div>
          <h2 className={styles.itemName}>{item.name}</h2>
          {item.description && (
            <p className={styles.itemDescription}>{item.description}</p>
          )}
        </div>
        <HealthScoreBadge score={scoreData?.score} />
      </div>
      <p className={styles.price}>Rs. {(item.priceRs / 100).toFixed(2)}</p>
      <NutritionCard nutrition={item.nutrition} />
      {alternativesData?.alternatives && (
        <AlternativesSuggestion alternatives={alternativesData.alternatives} />
      )}
      <button className={styles.addToCartButton} onClick={handleAddToCart}>
        Add to Cart
      </button>
      <AllergenWarning
        isOpen={showAllergenWarning}
        conflictingAllergens={conflictingAllergens}
        onClose={() => setShowAllergenWarning(false)}
        onConfirm={() => {
          addItem(item, scoreData?.score);
          setShowAllergenWarning(false);
        }}
      />
    </Card>
  );
}

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const { data: menuItems, isLoading: menuLoading, error: menuError } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => restaurantsApi.getMenu(id as string),
  });

  const { data: healthProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["healthProfile"],
    queryFn: () => usersApi.getHealthProfile(),
    retry: false,
  });

  if (menuLoading || profileLoading)
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  if (menuError)
    return (
      <div className={styles.container}>
        <p>Error loading menu</p>
      </div>
    );

  return (
    <div className={styles.container}>
      <Link href={`/restaurants/${id}`} className={styles.backLink}>
        ← Back to Restaurant
      </Link>
      <h1 className={styles.title}>Menu</h1>
      <div className={styles.grid}>
        {menuItems?.map((item) => (
          <MenuItemWithScore
            key={item.id}
            item={item}
            healthProfile={healthProfile}
          />
        ))}
      </div>
    </div>
  );
}