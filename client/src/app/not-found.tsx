"use client";
import Link from "next/link";
import styles from "./not-found.module.css";
import { Card } from "../components/Card";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.icon}>🥗</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link href="/" className={styles.homeButton}>
          Go back home
        </Link>
      </Card>
    </div>
  );
}