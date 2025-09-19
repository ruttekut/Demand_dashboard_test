import {
  ChatMessage,
  CompareSnapshot,
  DemandRequest,
  FileRef,
  FitScore,
  ProviderChat,
  ProviderSummary,
  QuoteAnalysis
} from '../types';

const now = new Date();
const hoursAgo = (hrs: number) => new Date(now.getTime() - hrs * 3600 * 1000).toISOString();

const sampleFiles: FileRef[] = [
  {
    id: 'file-1',
    name: 'kitchen-plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 485923,
    url: '/files/kitchen-plan.pdf'
  },
  {
    id: 'file-2',
    name: 'concept.png',
    mimeType: 'image/png',
    sizeBytes: 243892,
    url: '/files/concept.png'
  }
];

export const demandRequests: DemandRequest[] = [
  {
    id: 'req-1',
    title: 'Kitchen renovation',
    description: 'Full kitchen remodel with new cabinets, counters, and lighting.',
    category: 'Home Improvement',
    createdAt: hoursAgo(240),
    updatedAt: hoursAgo(6),
    status: 'in_progress',
    location: 'San Francisco, CA',
    budget: { min: 35000, max: 50000, currency: 'USD' },
    deadline: hoursAgo(-240),
    attachments: sampleFiles,
    providerChatIds: ['chat-1', 'chat-2', 'chat-3', 'chat-4']
  },
  {
    id: 'req-2',
    title: 'Weekly house cleaning',
    description: 'Looking for a weekly cleaning service for a 3 bedroom home.',
    category: 'Cleaning',
    createdAt: hoursAgo(120),
    updatedAt: hoursAgo(12),
    status: 'open',
    location: 'Oakland, CA',
    budget: { min: 120, max: 180, currency: 'USD' },
    deadline: null,
    attachments: [],
    providerChatIds: ['chat-5', 'chat-6']
  },
  {
    id: 'req-3',
    title: 'Event photographer',
    description: 'Need a photographer for a corporate event. 5 hours coverage.',
    category: 'Photography',
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(24),
    status: 'completed',
    location: 'San Jose, CA',
    budget: { min: 900, max: 1500, currency: 'USD' },
    deadline: hoursAgo(-48),
    attachments: [],
    providerChatIds: ['chat-7']
  }
];

export const providerSummaries: ProviderSummary[] = [
  {
    id: 'prov-1',
    displayName: 'Bay Builders Collective',
    introText: 'Design-forward remodeler specializing in contemporary kitchens and sustainable materials.',
    ratingAvg: 4.9,
    ratingCount: 212,
    yearsInBusiness: 14,
    badges: ['Top Pro', 'Sustainability Certified'],
    responseTimeMinutesAvg: 58,
    availability: 'Consultations within 3 days',
    priceRange: '$40k - $55k',
    locationCity: 'San Francisco, CA'
  },
  {
    id: 'prov-2',
    displayName: 'Golden Gate Renovations',
    introText: 'Family-owned contractor with transparent pricing and strong warranty coverage.',
    ratingAvg: 4.7,
    ratingCount: 167,
    yearsInBusiness: 18,
    badges: ['Background Checked', 'Licensed & Insured'],
    responseTimeMinutesAvg: 90,
    availability: 'Booking 4 weeks out',
    priceRange: '$38k - $48k',
    locationCity: 'Daly City, CA'
  },
  {
    id: 'prov-3',
    displayName: 'ChefSpaces Design',
    introText: 'Boutique design-build studio delivering chef-caliber kitchens.',
    ratingAvg: 4.8,
    ratingCount: 98,
    yearsInBusiness: 9,
    badges: ['Luxury Specialist', 'Top Reviewed'],
    responseTimeMinutesAvg: 45,
    availability: 'Design kickoff next week',
    priceRange: '$50k - $70k',
    locationCity: 'San Mateo, CA'
  },
  {
    id: 'prov-4',
    displayName: 'BuildRight Pros',
    introText: 'Efficient remodeling team focused on clear communication and on-time delivery.',
    ratingAvg: 4.5,
    ratingCount: 305,
    yearsInBusiness: 12,
    badges: ['On-Time Award'],
    responseTimeMinutesAvg: 35,
    availability: 'Can start in 3 weeks',
    priceRange: '$36k - $44k',
    locationCity: 'San Jose, CA'
  },
  {
    id: 'prov-5',
    displayName: 'Sparkle Cleaning Co.',
    introText: 'Reliable weekly home cleaning with eco-friendly supplies.',
    ratingAvg: 4.6,
    ratingCount: 143,
    yearsInBusiness: 7,
    badges: ['Recurring Favorite'],
    responseTimeMinutesAvg: 30,
    availability: 'Openings on Tuesdays & Fridays',
    priceRange: '$140 - $180',
    locationCity: 'Oakland, CA'
  },
  {
    id: 'prov-6',
    displayName: 'ShineTime Pros',
    introText: 'Detail-oriented team offering deep cleans and organization add-ons.',
    ratingAvg: 4.8,
    ratingCount: 201,
    yearsInBusiness: 11,
    badges: ['Top Pro'],
    responseTimeMinutesAvg: 25,
    availability: 'Next-day availability',
    priceRange: '$150 - $200',
    locationCity: 'Berkeley, CA'
  },
  {
    id: 'prov-7',
    displayName: 'LensCraft Studios',
    introText: 'Corporate event specialist capturing candid and staged moments.',
    ratingAvg: 4.9,
    ratingCount: 321,
    yearsInBusiness: 10,
    badges: ['Corporate Specialist'],
    responseTimeMinutesAvg: 40,
    availability: 'Available evenings & weekends',
    priceRange: '$1,200 - $1,600',
    locationCity: 'San Jose, CA'
  }
];

export const providerChats: ProviderChat[] = [
  { id: 'chat-1', requestId: 'req-1', providerId: 'prov-1', lastReadAt: hoursAgo(3), createdAt: hoursAgo(200) },
  { id: 'chat-2', requestId: 'req-1', providerId: 'prov-2', lastReadAt: hoursAgo(10), createdAt: hoursAgo(220) },
  { id: 'chat-3', requestId: 'req-1', providerId: 'prov-3', lastReadAt: hoursAgo(1), createdAt: hoursAgo(210) },
  { id: 'chat-4', requestId: 'req-1', providerId: 'prov-4', lastReadAt: hoursAgo(18), createdAt: hoursAgo(205) },
  { id: 'chat-5', requestId: 'req-2', providerId: 'prov-5', lastReadAt: hoursAgo(5), createdAt: hoursAgo(80) },
  { id: 'chat-6', requestId: 'req-2', providerId: 'prov-6', lastReadAt: hoursAgo(6), createdAt: hoursAgo(78) },
  { id: 'chat-7', requestId: 'req-3', providerId: 'prov-7', lastReadAt: hoursAgo(0.5), createdAt: hoursAgo(60) }
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    author: 'user',
    text: 'Hi! Excited to learn more about your approach.',
    createdAt: hoursAgo(24),
    deliveredAt: hoursAgo(24),
    readAt: hoursAgo(23.5)
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    author: 'provider',
    text: 'Thanks for reaching out! We love working on modern kitchens.',
    createdAt: hoursAgo(23),
    deliveredAt: hoursAgo(23),
    readAt: hoursAgo(22.5)
  },
  {
    id: 'msg-3',
    chatId: 'chat-2',
    author: 'provider',
    text: 'Sharing our portfolio along with a preliminary quote.',
    file: sampleFiles[0],
    createdAt: hoursAgo(12),
    deliveredAt: hoursAgo(12),
    readAt: hoursAgo(11.5)
  },
  {
    id: 'msg-4',
    chatId: 'chat-2',
    author: 'user',
    text: 'Appreciate it! Can you clarify warranty coverage?',
    createdAt: hoursAgo(10),
    deliveredAt: hoursAgo(10),
    readAt: hoursAgo(9.8)
  },
  {
    id: 'msg-5',
    chatId: 'chat-3',
    author: 'system',
    text: 'Fit score updated after quote upload.',
    createdAt: hoursAgo(4)
  },
  {
    id: 'msg-6',
    chatId: 'chat-3',
    author: 'provider',
    text: 'Here is a design mood board for review.',
    file: sampleFiles[1],
    createdAt: hoursAgo(3),
    deliveredAt: hoursAgo(3)
  },
  {
    id: 'msg-7',
    chatId: 'chat-4',
    author: 'provider',
    text: 'We can commit to a 16 week timeline with milestone payments.',
    createdAt: hoursAgo(8),
    deliveredAt: hoursAgo(8)
  },
  {
    id: 'msg-8',
    chatId: 'chat-5',
    author: 'provider',
    text: 'We can accommodate Tuesdays at 9am with two cleaners.',
    createdAt: hoursAgo(7)
  },
  {
    id: 'msg-9',
    chatId: 'chat-6',
    author: 'user',
    text: 'What products do you use for wood floors?',
    createdAt: hoursAgo(6)
  },
  {
    id: 'msg-10',
    chatId: 'chat-7',
    author: 'provider',
    text: 'Thanks for the review! Sharing a shot list for approval.',
    createdAt: hoursAgo(30)
  }
];

export const fitScores: FitScore[] = [
  {
    providerId: 'prov-1',
    requestId: 'req-1',
    score: 86,
    reasons: ['Strong design alignment', 'Responsive communication', 'Detailed quote']
  },
  {
    providerId: 'prov-2',
    requestId: 'req-1',
    score: 78,
    reasons: ['Transparent pricing', 'Warranty coverage']
  },
  {
    providerId: 'prov-3',
    requestId: 'req-1',
    score: 82,
    reasons: ['Chef-grade materials', 'Fast response']
  },
  {
    providerId: 'prov-4',
    requestId: 'req-1',
    score: 74,
    reasons: ['Short timeline', 'Extensive crew availability']
  },
  {
    providerId: 'prov-5',
    requestId: 'req-2',
    score: 71,
    reasons: ['Eco-friendly supplies', 'Flexible scheduling']
  },
  {
    providerId: 'prov-6',
    requestId: 'req-2',
    score: 79,
    reasons: ['Deep clean add-ons', 'High reliability']
  },
  {
    providerId: 'prov-7',
    requestId: 'req-3',
    score: 92,
    reasons: ['Corporate experience', 'Excellent reviews']
  }
];

export const quoteAnalyses: QuoteAnalysis[] = [
  {
    id: 'qa-1',
    requestId: 'req-1',
    providerId: 'prov-2',
    uploadedFile: sampleFiles[0],
    findings: {
      summary: 'Quote includes cabinetry, countertops, and appliances with a 2-year workmanship warranty.',
      totalPrice: 42000,
      includes: ['Custom cabinets', 'Quartz counters', 'Appliance install'],
      excludes: ['Permits', 'Appliance purchase'],
      risks: ['Permit approval timeline could slip by 2 weeks.'],
      warranty: '2 year workmanship',
      timeline: '16 weeks'
    },
    suggestedQuestions: [
      'Can you itemize labor versus materials? ',
      'What is the contingency plan if permits are delayed?'
    ],
    valueScore: 76
  }
];

export const compareSnapshots: CompareSnapshot[] = [
  {
    id: 'comp-1',
    requestId: 'req-1',
    providerIds: ['prov-1', 'prov-2'],
    createdAt: hoursAgo(5),
    criteria: [
      'Rating',
      'Warranty',
      'Price range'
    ],
    notes: 'Bay Builders edges ahead on design but Golden Gate has better warranty.'
  }
];
