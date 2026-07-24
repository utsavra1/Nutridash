"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth-store";
import styles from "./page.module.css";

type HealthGoal = "LOSE" | "MAINTAIN" | "GAIN";
type DietaryRestriction = "NONE" | "VEGETARIAN" | "VEGAN";

const GOALS: { value: HealthGoal; emoji: string; label: string; desc: string }[] = [
  { value: "LOSE",     emoji: "📉", label: "Lose Weight",     desc: "Caloric deficit" },
  { value: "MAINTAIN", emoji: "⚖️",  label: "Maintain",       desc: "Stay balanced" },
  { value: "GAIN",     emoji: "📈", label: "Gain Weight",     desc: "Caloric surplus" },
];

const DIETS: { value: DietaryRestriction; emoji: string; label: string }[] = [
  { value: "NONE",        emoji: "🍽️", label: "No restriction" },
  { value: "VEGETARIAN",  emoji: "🥦", label: "Vegetarian" },
  { value: "VEGAN",       emoji: "🌱", label: "Vegan" },
];

const ALLERGENS = [
  { key: "NUTS",      emoji: "🥜" },
  { key: "GLUTEN",    emoji: "🌾" },
  { key: "DAIRY",     emoji: "🥛" },
  { key: "SHELLFISH", emoji: "🦐" },
  { key: "EGG",       emoji: "🥚" },
];

export default function HealthProfilePage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();

  const [formData, setFormData] = useState({
    age: 25,
    weightKg: 70,
    heightCm: 170,
    goal: "MAINTAIN" as HealthGoal,
    dietaryRestriction: "NONE" as DietaryRestriction,
    allergens: [] as string[],
    calorieTarget: 2000,
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: usersApi.createHealthProfile,
    onSuccess: () => {
      if (user) setUser({ ...user, isOnboardingComplete: true });
      router.push("/restaurants");
    },
    onError: () => setError("Failed to save health profile. Please try again."),
  });

  const toggleAllergen = (a: string) =>
    setFormData((p) => ({
      ...p,
      allergens: p.allergens.includes(a)
        ? p.allergens.filter((x) => x !== a)
        : [...p.allergens, a],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate(formData);
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.emoji}>🥗</div>
          <h1 className={styles.title}>Set Up Your Health Profile</h1>
          <p className={styles.subtitle}>
            Help us personalise your meal recommendations
          </p>
        </div>

        {/* Progress steps */}
        <div className={styles.progress}>
          <div className={`${styles.progressStep} ${styles.done}`}>
            <span className={styles.progressDot}>✓</span>
            <span>Account</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${styles.active}`}>
            <span className={styles.progressDot}>2</span>
            <span>Health</span>
          </div>
          <div className={styles.progressLine} />
          <div className={styles.progressStep}>
            <span className={styles.progressDot}>3</span>
            <span>Explore</span>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Body metrics */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>📏 Body Metrics</p>
            <div className={styles.grid3}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="age">Age</label>
                <input
                  id="age" type="number" min={13} max={120} required
                  className={styles.input}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight" type="number" step="0.1" min={20} max={300} required
                  className={styles.input}
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="height">Height (cm)</label>
                <input
                  id="height" type="number" step="0.1" min={100} max={250} required
                  className={styles.input}
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>🎯 Your Goal</p>
            <div className={styles.goalGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`${styles.goalCard} ${formData.goal === g.value ? styles.selected : ""}`}
                  onClick={() => setFormData({ ...formData, goal: g.value })}
                >
                  <span className={styles.goalEmoji}>{g.emoji}</span>
                  <span className={styles.goalLabel}>{g.label}</span>
                  <span className={styles.goalDesc}>{g.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Diet + Calories */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>🥙 Dietary Preference</p>
            <div className={styles.dietGrid}>
              {DIETS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`${styles.dietCard} ${formData.dietaryRestriction === d.value ? styles.selected : ""}`}
                  onClick={() => setFormData({ ...formData, dietaryRestriction: d.value })}
                >
                  <span className={styles.dietEmoji}>{d.emoji}</span>
                  <span className={styles.dietLabel}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>⚠️ Allergens to Avoid</p>
            <div className={styles.allergenGrid}>
              {ALLERGENS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`${styles.allergenChip} ${formData.allergens.includes(a.key) ? styles.selected : ""}`}
                  onClick={() => toggleAllergen(a.key)}
                >
                  {a.emoji} {a.key}
                </button>
              ))}
            </div>
          </div>

          {/* Calorie target */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>🔥 Daily Calorie Target</p>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="calories">Calories (kcal)</label>
              <input
                id="calories" type="number" min={800} max={6000} required
                className={styles.input}
                value={formData.calorieTarget}
                onChange={(e) => setFormData({ ...formData, calorieTarget: parseInt(e.target.value) })}
              />
              <span className={styles.calorieHint}>
                Typical ranges: 1200–1500 (cut) · 1800–2200 (maintain) · 2500–3500 (bulk)
              </span>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} className={styles.submitBtn}>
            {mutation.isPending ? (
              <>{" "}Saving…</>
            ) : (
              <>Save Profile &amp; Start Exploring →</>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
