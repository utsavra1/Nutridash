"use client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { nutritionApi } from "../../lib/api";
import styles from "./page.module.css";

const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac"];

export default function NutritionDashboardPage() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["nutritionDashboard"],
    queryFn: () => nutritionApi.getDashboard(),
  });

  if (isLoading)
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.container}>
        <p>Error loading dashboard</p>
      </div>
    );

  if (!dashboardData || dashboardData.dailyData.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your Nutrition Dashboard</h1>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No Data Yet</h2>
          <p className={styles.emptyDescription}>
            Place some orders to start tracking your nutrition!
          </p>
        </div>
      </div>
    );
  }

  const macroData = [
    { name: "Protein", value: dashboardData.totalProteinG },
    { name: "Carbs", value: dashboardData.totalCarbsG },
    { name: "Fat", value: dashboardData.totalFatG },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Nutrition Dashboard</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Calories</p>
          <p className={styles.statValue}>{dashboardData.totalCalories}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Protein (g)</p>
          <p className={styles.statValue}>
            {dashboardData.totalProteinG.toFixed(1)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Carbs (g)</p>
          <p className={styles.statValue}>
            {dashboardData.totalCarbsG.toFixed(1)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Fat (g)</p>
          <p className={styles.statValue}>
            {dashboardData.totalFatG.toFixed(1)}
          </p>
        </div>
      </div>

      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Daily Calories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalCalories" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Macro Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Average Health Score Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="healthScoreAvg"
                stroke="#16a34a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
