export type Company = {
  slug: string;
  name: string;
  fullName: string | null;
  logoUrl: string | null;
  description: string | null;
  category: string | null;
  displayOrder: number;
  questionCount: number;
};
