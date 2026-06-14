export type PwRule = { key: string; label: string; test: (s: string) => boolean };

export const passwordRules: PwRule[] = [
  { key: "len", label: "Ən az 8 simvol", test: (s) => s.length >= 8 },
  { key: "upper", label: "Ən az 1 böyük hərf (A-Z)", test: (s) => /[A-Z]/.test(s) },
  { key: "lower", label: "Ən az 1 kiçik hərf (a-z)", test: (s) => /[a-z]/.test(s) },
  { key: "digit", label: "Ən az 1 rəqəm (0-9)", test: (s) => /\d/.test(s) },
  { key: "special", label: "Ən az 1 xüsusi simvol (!@#$…)", test: (s) => /[^A-Za-z0-9]/.test(s) },
];

export function passwordScore(s: string): number {
  return passwordRules.reduce((n, r) => n + (r.test(s) ? 1 : 0), 0);
}

export function isStrongPassword(s: string): boolean {
  return passwordScore(s) === passwordRules.length;
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score <= 1) return { label: "Çox zəif", color: "bg-destructive" };
  if (score === 2) return { label: "Zəif", color: "bg-destructive/80" };
  if (score === 3) return { label: "Orta", color: "bg-yellow-500" };
  if (score === 4) return { label: "Yaxşı", color: "bg-blue-500" };
  return { label: "Güclü", color: "bg-green-500" };
}
