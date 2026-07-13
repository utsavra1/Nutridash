"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Restaurant } from "../../types";
import { Card } from "../../components/Card";
import { restaurantsApi } from "../../lib/api";
import styles from "../page.module.css";

export default function RestaurantsPage() {
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => restaurantsApi.getAll(),
  });

  if (isLoading) return <div className={styles.container}><p>Loading...</p></div>;
  if (error) return <div className={styles.container}><p>Error loading restaurants</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Restaurants</h1>
      <div className={styles.grid}>
        {restaurants?.map((restaurant) => (
          <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
            <Card className={styles.cardLink}>
              <div className={styles.cardContent}>
                <h2 className={styles.restaurantName}>{restaurant.name}</h2>
                <p className={styles.cuisine}>{restaurant.cuisine}</p>
                <p className={styles.address}>{restaurant.address}</p>
                <div className={styles.footer}>
                  <span className={styles.rating}>
                    Health Rating: {restaurant.healthRating}/5
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
