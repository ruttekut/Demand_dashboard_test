import { computeFitScore } from '../fitScore';
import { DemandRequest, ProviderSummary } from '../../../types';

describe('computeFitScore', () => {
  const request: DemandRequest = {
    id: 'req-1',
    title: 'Kitchen remodel',
    description: 'Full remodel',
    category: 'Home Improvement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
    location: 'San Francisco, CA',
    budget: null,
    deadline: null,
    attachments: [],
    providerChatIds: []
  };

  const provider: ProviderSummary = {
    id: 'prov-1',
    displayName: 'Bay Builders',
    introText: 'Experienced remodelers with quick response times.',
    ratingAvg: 4.9,
    ratingCount: 200,
    yearsInBusiness: 12,
    badges: ['Top Pro'],
    responseTimeMinutesAvg: 40,
    availability: '2 weeks',
    priceRange: '$40k - $50k',
    locationCity: 'San Francisco, CA'
  };

  it('boosts score for local high rated providers', () => {
    const score = computeFitScore({ request, provider, signal: 'initial' });
    expect(score.score).toBeGreaterThanOrEqual(70);
    expect(score.reasons).toContain('Local proximity');
    expect(score.reasons).toContain('Excellent reviews');
  });

  it('incorporates follow-on signals like user messages and quote uploads', () => {
    const afterMessage = computeFitScore({ request, provider, signal: 'user_message' });
    const afterQuote = computeFitScore({
      request,
      provider,
      signal: 'quote_uploaded',
      previous: afterMessage,
      valueScore: 80
    });
    expect(afterQuote.score).toBeGreaterThan(afterMessage.score);
    expect(afterQuote.reasons).toContain('Active engagement');
    expect(afterQuote.reasons).toContain('Quote analyzed');
  });
});
