import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders, createTestQueryClient } from '../../../test-utils';
import { ChatWorkspace } from '../ChatWorkspace';
import { DemandRequest, ProviderChat, ProviderSummary, ChatMessage, FitScore } from '../../../types';
import { useRequestUiStore } from '../../../state/useRequestUiStore';

const request: DemandRequest = {
  id: 'req-chat',
  title: 'Chat request',
  description: 'Test description',
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

const chats: ProviderChat[] = [
  { id: 'chat-a', requestId: request.id, providerId: 'prov-a', lastReadAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'chat-b', requestId: request.id, providerId: 'prov-b', lastReadAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString() }
];

const providers = new Map<string, ProviderSummary>([
  [
    'prov-a',
    {
      id: 'prov-a',
      displayName: 'Provider Alpha',
      introText: 'Alpha intro',
      ratingAvg: 4.8,
      ratingCount: 120,
      yearsInBusiness: 8,
      badges: [],
      responseTimeMinutesAvg: 40,
      availability: 'Soon',
      priceRange: '$100',
      locationCity: 'San Francisco, CA'
    }
  ],
  [
    'prov-b',
    {
      id: 'prov-b',
      displayName: 'Provider Beta',
      introText: 'Beta intro',
      ratingAvg: 4.6,
      ratingCount: 80,
      yearsInBusiness: 6,
      badges: [],
      responseTimeMinutesAvg: 30,
      availability: 'Immediate',
      priceRange: '$120',
      locationCity: 'Oakland, CA'
    }
  ]
]);

beforeEach(() => {
  useRequestUiStore.setState({ selectedChatByRequest: {}, compareSelection: {}, composerDrafts: {} });
});

describe('ChatWorkspace', () => {
  it('marks chats with new messages as unread and allows switching providers', () => {
    const client = createTestQueryClient();
    const recentMessage: ChatMessage = {
      id: 'msg-1',
      chatId: 'chat-b',
      author: 'provider',
      text: 'Latest update',
      createdAt: new Date().toISOString()
    };
    client.setQueryData(['messages', 'chat-a'], []);
    client.setQueryData(['messages', 'chat-b'], [recentMessage]);
    client.setQueryData(['fit-scores', request.id], [
      { providerId: 'prov-a', requestId: request.id, score: 80, reasons: ['Responsive'] },
      { providerId: 'prov-b', requestId: request.id, score: 75, reasons: ['Fast response'] }
    ] as FitScore[]);

    renderWithProviders(
      <ChatWorkspace request={request} chats={chats} providerMap={providers} />,
      { client }
    );

    expect(screen.getByText(/Unread/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Provider Beta/i }));
    expect(screen.getByLabelText(/Message/i)).toHaveFocus();
  });
});
