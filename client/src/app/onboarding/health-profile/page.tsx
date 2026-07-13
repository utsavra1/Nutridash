"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi, usersApi } from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth-store";
import styles from "./page.module.css";

type HealthGoal = "LOSE" | "MAINTAIN" | "GAIN";
type DietaryRestriction = "NONE" | "VEGETARIAN" | "VEGAN";

export default function HealthProfilePage () {
    const router = useRouter();
    const {setUser, user} = useAuthStore();
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

    const allergenOptions = ["NUTS", "GLUTEN", "DAIRY", "SHELLFISH", "EGG"];

    const createProfileMutation = useMutation({
        mutationFn: usersApi.createHealthProfile,
        onSuccess: () => {
            if(user){
                setUser({ ...user, isOnboardingComplete: true });
            }
            router.push("/");
        },

        onError: () => {
        setError("Failed to create health profile");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        createProfileMutation.mutate(formData);
    };

    const handleAllergenToggle = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
        }));
    };

    return (
    <div className={styles.container}>
      <h1 className={styles.title}>Complete Your Health Profile</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="age">Age</label>
          <input
            id="age"
            type="number"
            min="13"
            max="120"
            required
            className={styles.input}
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="weightKg">Weight (kg)</label>
          <input
            id="weightKg"
            type="number"
            step="0.1"
            min="20"
            max="300"
            required
            className={styles.input}
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="heightCm">Height (cm)</label>
          <input
            id="heightCm"
            type="number"
            step="0.1"
            min="100"
            max="250"
            required
            className={styles.input}
            value={formData.heightCm}
            onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="goal">Goal</label>
          <select
            id="goal"
            required
            className={styles.select}
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as HealthGoal })}
          >
            <option value="LOSE">Lose Weight</option>
            <option value="MAINTAIN">Maintain Weight</option>
            <option value="GAIN">Gain Weight</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="dietaryRestriction">Dietary Restriction</label>
          <select
            id="dietaryRestriction"
            required
            className={styles.select}
            value={formData.dietaryRestriction}
            onChange={(e) => setFormData({ ...formData, dietaryRestriction: e.target.value as DietaryRestriction })}
          >
            <option value="NONE">None</option>
            <option value="VEGETARIAN">Vegetarian</option>
            <option value="VEGAN">Vegan</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Allergens (select all that apply)</label>
          <div className={styles.checkboxGroup}>
            {allergenOptions.map((allergen) => (
              <label key={allergen} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={formData.allergens.includes(allergen)}
                  onChange={() => handleAllergenToggle(allergen)}
                />
                {allergen}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="calorieTarget">Daily Calorie Target</label>
          <input
            id="calorieTarget"
            type="number"
            min="800"
            max="6000"
            required
            className={styles.input}
            value={formData.calorieTarget}
            onChange={(e) => setFormData({ ...formData, calorieTarget: parseInt(e.target.value) })}
          />
        </div>
        <button
          type="submit"
          disabled={createProfileMutation.isPending}
          className={styles.button}
        >
          {createProfileMutation.isPending ? "Saving..." : "Save Profile & Continue"}
        </button>
      </form>
    </div>
  );

}