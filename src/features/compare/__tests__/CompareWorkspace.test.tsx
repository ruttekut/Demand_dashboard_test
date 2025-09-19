import { screen } from '@testing-library/react';
import { renderWithProviders, createTestQueryClient } from '../../../test-utils';
import { CompareWorkspace } from '../CompareWorkspace';
import { DemandRequest, FitScore, ProviderSummary } from '../../../types';
import { useRequestUiStore } from '../../../state/useRequestUiStore';

describe('CompareWorkspace', () => {
  const request: DemandRequest = {
    id: 'req-test',
    title: 'Test request',
    description: '',
    category: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
    location: 'San Francisco, CA',
    budget: null,
    deadline: null,
    attachments: [],
    providerChatIds: []
  };

  const providers: ProviderSummary[] = [
    {
      id: 'prov-a',
      displayName: 'Provider Alpha',
      introText: 'A reliable provider with strong warranty.',
      ratingAvg: 4.9,
      ratingCount: 120,
      yearsInBusiness: 10,
      badges: ['Top Pro'],
      responseTimeMinutesAvg: 45,
      availability: '2 weeks',
      priceRange: '$10k - $12k',
      locationCity: 'San Francisco, CA'
    },
    {
      id: 'prov-b',
      displayName: 'Provider Beta',
      introText: 'Budget friendly team with weekend availability.',
      ratingAvg: 4.6,
      ratingCount: 90,
      yearsInBusiness: 6,
      badges: ['Background Checked'],
      responseTimeMinutesAvg: 30,
      availability: 'Immediate',
      priceRange: '$8k - $11k',
      locationCity: 'Oakland, CA'
    }
  ];

  beforeEach(() => {
    useRequestUiStore.setState({ compareSelection: {} });
  });

  it('renders sticky headers and highlights best fit provider', async () => {
    const client = createTestQueryClient();
    const fitScores: FitScore[] = [
      { providerId: 'prov-a', requestId: request.id, score: 88, reasons: ['Warranty strength'] },
      { providerId: 'prov-b', requestId: request.id, score: 72, reasons: ['Fast response'] }
    ];
    client.setQueryData(['fit-scores', request.id], fitScores);
    client.setQueryData(['compare-snapshots', request.id], []);

    useRequestUiStore.getState().setCompareSelection(request.id, providers.map((provider) => provider.id));

    renderWithProviders(<CompareWorkspace request={request} providers={providers} />, { client });

    const table = screen.getByRole('grid');
    const thead = table.querySelector('thead');
    expect(thead).toHaveClass('sticky');

    const highlight = await screen.findByText(/leads with a fit score/i);
    expect(highlight.textContent).toContain('Provider Alpha');
  });
});
