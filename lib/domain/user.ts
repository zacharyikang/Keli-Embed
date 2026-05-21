export type User = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  dailyGoal: number;
  streakCount: number;
  lastActiveAt: Date;
  createdAt: Date;
};
