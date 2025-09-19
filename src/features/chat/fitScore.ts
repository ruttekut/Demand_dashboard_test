import { DemandRequest, FitScore, ProviderSummary } from '../../types';

interface FitScoreOptions {
  request: DemandRequest;
  provider: ProviderSummary;
  previous?: FitScore;
  signal: 'user_message' | 'quote_uploaded' | 'guidance_question' | 'initial';
  valueScore?: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function computeFitScore({ request, provider, previous, signal, valueScore }: FitScoreOptions): FitScore {
  const base = previous?.score ?? 65;
  const reasons = new Set<string>(previous?.reasons ?? []);

  let score = base;

  if (provider.locationCity.includes(request.location.split(',')[0] ?? '')) {
    score += 4;
    reasons.add('Local proximity');
  }

  if (provider.yearsInBusiness > 10) {
    score += 3;
    reasons.add('Seasoned provider');
  }

  if (provider.ratingAvg >= 4.8) {
    score += 4;
    reasons.add('Excellent reviews');
  }

  if (provider.badges.length > 0) {
    score += 2;
    reasons.add('Badge recognition');
  }

  if (signal === 'user_message') {
    score += 2;
    reasons.add('Active engagement');
  }

  if (signal === 'guidance_question') {
    score += 1;
    reasons.add('Clarified requirements');
  }

  if (signal === 'quote_uploaded') {
    if (typeof valueScore === 'number') {
      score = (score + valueScore) / 2;
      reasons.add('Quote analyzed');
    } else {
      score += 3;
      reasons.add('Quote received');
    }
  }

  return {
    providerId: provider.id,
    requestId: request.id,
    score: Math.round(clamp(score)),
    reasons: Array.from(reasons).slice(0, 4)
  };
}
