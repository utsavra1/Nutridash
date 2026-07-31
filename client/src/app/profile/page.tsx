"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, authApi } from "../../lib/api";
import { useAuthStore } from "../../stores/auth-store";
import type { User } from "../../types";
import styles from "./page.module.css";

const ALLERGEN_OPTIONS = ["NUTS", "GLUTEN", "DAIRY", "SHELLFISH", "EGGS", "SOY"];
const GOAL_LABELS: Record<string, string> = { LOSE: "Lose Weight", MAINTAIN: "Maintain Weight", GAIN: "Gain Weight" };
const DIET_LABELS: Record<string, string> = { NONE: "No Restriction", VEGETARIAN: "Vegetarian", VEGAN: "Vegan" };

// ─── Personal Info Section ────────────────────────────────────────────────────
function PersonalInfoSection() {
  const queryClient = useQueryClient();
  const { setUser, user: authUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: usersApi.getMe,
  });

  useEffect(() => {
    if (user && !editing) {
      setName(user.name);
    }
  }, [user, editing]);

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ name }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setAuthUser(updated);
      setEditing(false);
      setFeedback({ type: "success", msg: "Name updated successfully." });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", msg: err.response?.data?.message || "Failed to update." });
    },
  });

  const setAuthUser = (updated: User) => {
    if (authUser) setUser({ ...authUser, name: updated.name });
  };

  if (isLoading) return <div className={styles.section}><p>Loading...</p></div>;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>👤</span> Personal Info
        </h2>
        {!editing && (
          <button className={styles.editBtn} onClick={() => { if (!user) return; setName(user.name); setEditing(true); }}>
            Edit
          </button>
        )}
      </div>

      {feedback && <div className={styles[feedback.type]}>{feedback.msg}</div>}

      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Full Name</span>
            {editing ? (
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            ) : (
              <span className={styles.value}>{user?.name}</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user?.email}</span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Role</span>
            <span className={styles.value}>{user?.role?.replace("_", " ")}</span>
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Onboarding</span>
            <span className={styles.value}>{user?.isOnboardingComplete ? "Complete ✅" : "Incomplete ⚠️"}</span>
          </div>
        </div>

        {editing && (
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
            <button
              className={styles.saveBtn}
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !name.trim()}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Health Profile Section ───────────────────────────────────────────────────
function HealthProfileSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["healthProfile"],
    queryFn: usersApi.getHealthProfile,
    retry: false,
  });

  const [form, setForm] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    goal: "MAINTAIN",
    dietaryRestriction: "NONE",
    allergens: [] as string[],
    calorieTarget: "",
  });

  const startEditing = () => {
    if (profile) {
      setForm({
        age: String(profile.age),
        weightKg: String(profile.weightKg),
        heightCm: String(profile.heightCm),
        goal: profile.goal,
        dietaryRestriction: profile.dietaryRestriction,
        allergens: [...profile.allergens],
        calorieTarget: String(profile.calorieTarget),
      });
    }
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateHealthProfile({
        age: Number(form.age),
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        goal: form.goal as any,
        dietaryRestriction: form.dietaryRestriction as any,
        allergens: form.allergens,
        calorieTarget: Number(form.calorieTarget),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthProfile"] });
      setEditing(false);
      setFeedback({ type: "success", msg: "Health profile updated successfully." });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", msg: err.response?.data?.message || "Failed to update." });
    },
  });

  const toggleAllergen = (a: string) => {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(a) ? f.allergens.filter((x) => x !== a) : [...f.allergens, a],
    }));
  };

  if (isLoading) return <div className={styles.section}><p>Loading...</p></div>;

  if (!profile && !editing) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🏃</span> Health Profile</h2>
        </div>
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>No health profile yet.</p>
        <button className={styles.saveBtn} onClick={() => setEditing(true)}>Set Up Health Profile</button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>🏃</span> Health Profile</h2>
        {!editing && <button className={styles.editBtn} onClick={startEditing}>Edit</button>}
      </div>

      {feedback && <div className={styles[feedback.type]}>{feedback.msg}</div>}

      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Age</span>
            {editing ? (
              <input type="number" className={styles.input} value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })} />
            ) : (
              <span className={styles.value}>{profile?.age} years</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Weight</span>
            {editing ? (
              <input type="number" className={styles.input} value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="kg" />
            ) : (
              <span className={styles.value}>{profile?.weightKg} kg</span>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Height</span>
            {editing ? (
              <input type="number" className={styles.input} value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="cm" />
            ) : (
              <span className={styles.value}>{profile?.heightCm} cm</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Daily Calorie Target</span>
            {editing ? (
              <input type="number" className={styles.input} value={form.calorieTarget}
                onChange={(e) => setForm({ ...form, calorieTarget: e.target.value })} placeholder="kcal" />
            ) : (
              <span className={styles.value}>{profile?.calorieTarget} kcal</span>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Goal</span>
            {editing ? (
              <select className={styles.select} value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                <option value="LOSE">Lose Weight</option>
                <option value="MAINTAIN">Maintain Weight</option>
                <option value="GAIN">Gain Weight</option>
              </select>
            ) : (
              <span className={styles.value}>{GOAL_LABELS[profile?.goal || "MAINTAIN"]}</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Dietary Restriction</span>
            {editing ? (
              <select className={styles.select} value={form.dietaryRestriction}
                onChange={(e) => setForm({ ...form, dietaryRestriction: e.target.value })}>
                <option value="NONE">No Restriction</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </select>
            ) : (
              <span className={styles.value}>{DIET_LABELS[profile?.dietaryRestriction || "NONE"]}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <span className={styles.label}>Allergens</span>
          <div className={styles.allergensGrid}>
            {ALLERGEN_OPTIONS.map((a) => {
              const active = editing
                ? form.allergens.includes(a)
                : (profile?.allergens || []).includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  className={`${styles.allergenChip} ${active ? styles.allergenChipActive : ""} ${!editing ? styles.allergenChipReadonly : ""}`}
                  onClick={() => editing && toggleAllergen(a)}
                >
                  {a}
                </button>
              );
            })}
          </div>
          {!editing && (profile?.allergens || []).length === 0 && (
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>None selected</span>
          )}
        </div>

        {editing && (
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
            <button
              className={styles.saveBtn}
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Change Password Section ──────────────────────────────────────────────────
function ChangePasswordSection() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setFeedback({ type: "success", msg: "Password changed successfully." });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", msg: err.response?.data?.message || "Failed to change password." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (form.newPassword.length < 8) {
      setFeedback({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={styles.dangerSection}>
      <h2 className={styles.dangerTitle}>🔐 Change Password</h2>
      {feedback && <div className={styles[feedback.type]}>{feedback.msg}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <span className={styles.label}>Current Password</span>
          <input
            type="password"
            className={styles.input}
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
          />
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <span className={styles.label}>New Password</span>
            <input
              type="password"
              className={styles.input}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>
          <div className={styles.formGroup}>
            <span className={styles.label}>Confirm New Password</span>
            <input
              type="password"
              className={styles.input}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repeat new password"
              required
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={mutation.isPending}>
            {mutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Manage your account details and health preferences</p>
      </div>

      {/* Avatar card */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className={styles.avatarInfo}>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <span className={styles.roleBadge}>{user?.role?.replace("_", " ")}</span>
        </div>
      </div>

      <PersonalInfoSection />
      <HealthProfileSection />
      <ChangePasswordSection />
    </div>
  );
}
