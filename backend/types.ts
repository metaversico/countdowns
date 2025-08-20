export interface CountdownInput {
  title: string;
  socialAccounts?: string[];
  text?: string;
  imageUrl?: string;
  ctaUrl?: string;
  expiration: string; // ISO date or relative duration string
  expiredText?: string;
  expiredImageUrl?: string;
  expiredCtaUrl?: string;
}

export interface Countdown extends CountdownInput {
  id: string;
  createdAt: string; // ISO date
}
