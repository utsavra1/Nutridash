"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "../../../types";
import { Card } from "../../../components/Card";
import { restaurantsApi } from "../../../lib/api";
import styles from "./page.module.css";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => restaurantsApi.getById(id as string),
  });

  if (isLoading) return <div className={styles.container}><p>Loading...</p></div>;
  if (error || !restaurant) return <div className={styles.container}><p>Restaurant not found</p></div>;

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back to Restaurants
      </Link>
      <Card>
        <div className={styles.cardContent}>
          <h1 className={styles.title}>{restaurant.name}</h1>
          <p className={styles.cuisine}>{restaurant.cuisine}</p>
          <p className={styles.address}>{restaurant.address}</p>
          <div className={styles.infoRow}>
            <p className={styles.rating}>Health Rating: {restaurant.healthRating}/5</p>
          </div>
          <Link
            href={`/restaurants/${id}/menu`}
            className={styles.menuButton}
          >
            View Menu
          </Link>
        </div>
      </Card>
    </div>
  );
}