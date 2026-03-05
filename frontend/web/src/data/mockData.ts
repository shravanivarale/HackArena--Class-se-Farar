// ========================
// VitalScore Finance — All Mock Data
// ========================

export const currentUser = {
    id: 'user_001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@gmail.com',
    avatar: 'AS',
    league: 'Gold',
    streakDays: 14,
    freezesAvailable: 1,
    vitalPoints: 1550,
};

export const currentScore = {
    score: 742,
    band: 'Vital Strong',
    bandKey: 'strong',
    trajectory: 'IMPROVING',
    change: +18,
    changePercent: 2.4,
    lastUpdated: new Date().toISOString(),
    components: {
        necessityRatio: 0.68,
        savingsRatio: 0.22,
        debtPenalty: -30,
        streakBonus: 42,
        challengeBonus: 25,
    },
};

export const scoreHistory = [
    { month: 'Aug', score: 580 },
    { month: 'Sep', score: 612 },
    { month: 'Oct', score: 645 },
    { month: 'Nov', score: 668 },
    { month: 'Dec', score: 695 },
    { month: 'Jan', score: 724 },
    { month: 'Feb', score: 742 },
];

export const scoreForecast = [
    { day: 'Day 0', current: 742, optimized: 742 },
    { day: 'Day 7', current: 739, optimized: 756 },
    { day: 'Day 14', current: 735, optimized: 768 },
    { day: 'Day 21', current: 731, optimized: 779 },
    { day: 'Day 30', current: 726, optimized: 795 },
];

export const recentTransactions = [
    { id: 't1', date: '2025-02-26', description: 'ZOMATO ORDER', merchant: 'Zomato', amount: 485, category: 'Discretionary.DiningOut', categoryLabel: 'Dining Out', type: 'DEBIT' },
    { id: 't2', date: '2025-02-26', description: 'JIO BILL', merchant: 'Jio', amount: 599, category: 'Essential.Bills', categoryLabel: 'Utilities', type: 'DEBIT' },
    { id: 't3', date: '2025-02-25', description: 'AMAZON ORDER', merchant: 'Amazon', amount: 1299, category: 'Discretionary.Shopping', categoryLabel: 'Shopping', type: 'DEBIT' },
    { id: 't4', date: '2025-02-25', description: 'SALARY CREDIT', merchant: 'Employer', amount: 85000, category: 'Income', categoryLabel: 'Income', type: 'CREDIT' },
    { id: 't5', date: '2025-02-24', description: 'DMART GROCERIES', merchant: 'DMart', amount: 2340, category: 'Essential.Groceries', categoryLabel: 'Groceries', type: 'DEBIT' },
    { id: 't6', date: '2025-02-24', description: 'NETFLIX SUBSCRIPTION', merchant: 'Netflix', amount: 649, category: 'Discretionary.Entertainment', categoryLabel: 'Entertainment', type: 'DEBIT' },
    { id: 't7', date: '2025-02-23', description: 'ZERODHA SIP', merchant: 'Zerodha', amount: 5000, category: 'Savings.Investment', categoryLabel: 'Investment', type: 'DEBIT' },
    { id: 't8', date: '2025-02-23', description: 'UBER CAB', merchant: 'Uber', amount: 320, category: 'Essential.Transportation', categoryLabel: 'Transport', type: 'DEBIT' },
    { id: 't9', date: '2025-02-22', description: 'SWIGGY ORDER', merchant: 'Swiggy', amount: 350, category: 'Discretionary.DiningOut', categoryLabel: 'Dining Out', type: 'DEBIT' },
    { id: 't10', date: '2025-02-22', description: 'RENT PAYMENT', merchant: 'Landlord', amount: 18000, category: 'Essential.Housing', categoryLabel: 'Housing', type: 'DEBIT' },
];

export const spendingBreakdown = [
    { category: 'Housing', amount: 18000, color: '#4da6ff', pct: 32 },
    { category: 'Groceries', amount: 4800, color: '#00d4aa', pct: 8.5 },
    { category: 'Dining Out', amount: 3200, color: '#ffc107', pct: 5.7 },
    { category: 'Investment', amount: 10000, color: '#7c6bff', pct: 17.8 },
    { category: 'Transport', amount: 1800, color: '#4ade80', pct: 3.2 },
    { category: 'Entertainment', amount: 1300, color: '#ff6b35', pct: 2.3 },
    { category: 'Shopping', amount: 3500, color: '#e879f9', pct: 6.2 },
    { category: 'Bills', amount: 1200, color: '#94a3b8', pct: 2.1 },
];

export const challenges = [
    {
        id: 'ch1',
        type: 'REDUCE_CATEGORY',
        title: 'Cut Dining Out by 20%',
        description: 'Reduce spend on Zomato/Swiggy by ₹640 this week',
        difficulty: 'Medium',
        targetValue: 3200,
        currentValue: 1850,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        stakeAmount: 200,
        scoreBonus: 30,
        status: 'ACTIVE',
    },
    {
        id: 'ch2',
        type: 'SAVINGS_VELOCITY',
        title: 'Increase Savings by 10%',
        description: 'Save an additional ₹1,000 before week end',
        difficulty: 'Easy',
        targetValue: 10000,
        currentValue: 7500,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        stakeAmount: 100,
        scoreBonus: 15,
        status: 'ACTIVE',
    },
    {
        id: 'ch3',
        type: 'BUILD_EMERGENCY_FUND',
        title: 'Build Emergency Fund',
        description: 'Transfer ₹1,000 to emergency savings account',
        difficulty: 'Hard',
        targetValue: 1000,
        currentValue: 0,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        stakeAmount: 500,
        scoreBonus: 50,
        status: 'ACTIVE',
    },
];

export const challengeHistory = [
    { id: 'ch_old1', title: 'No Dining Out Week', difficulty: 'Hard', status: 'COMPLETED', earnedPoints: 50, completedAt: '2025-02-16' },
    { id: 'ch_old2', title: 'Grocery Budget ₹3k', difficulty: 'Medium', status: 'COMPLETED', earnedPoints: 30, completedAt: '2025-02-09' },
    { id: 'ch_old3', title: 'Cancel 1 Subscription', difficulty: 'Easy', status: 'FAILED', earnedPoints: 0, completedAt: '2025-02-02' },
    { id: 'ch_old4', title: 'Invest ₹5k this week', difficulty: 'Medium', status: 'COMPLETED', earnedPoints: 30, completedAt: '2025-01-26' },
];




export const getBandConfig = (score: number) => {
    if (score >= 800) return { label: 'Vital Elite', key: 'elite', color: '#00d4aa', pulseColor: '#00d4aa', glowColor: 'rgba(0,212,170,0.4)', speed: 1.0, rhythm: 'strong' };
    if (score >= 600) return { label: 'Vital Strong', key: 'strong', color: '#4ade80', pulseColor: '#4ade80', glowColor: 'rgba(74,222,128,0.35)', speed: 1.2, rhythm: 'steady' };
    if (score >= 400) return { label: 'Vital Warning', key: 'warning', color: '#ffc107', pulseColor: '#ffc107', glowColor: 'rgba(255,193,7,0.35)', speed: 1.6, rhythm: 'irregular' };
    if (score >= 200) return { label: 'Vital Critical', key: 'critical', color: '#ff6b35', pulseColor: '#ff6b35', glowColor: 'rgba(255,107,53,0.4)', speed: 2.0, rhythm: 'erratic' };
    return { label: 'Vital Emergency', key: 'emergency', color: '#ff4757', pulseColor: '#ff4757', glowColor: 'rgba(255,71,87,0.4)', speed: 0.3, rhythm: 'flatline' };
};

export const getCategoryColor = (category: string): string => {
    const map: Record<string, string> = {
        'Discretionary.DiningOut': '#ffc107',
        'Essential.Bills': '#94a3b8',
        'Discretionary.Shopping': '#e879f9',
        'Income': '#00d4aa',
        'Essential.Groceries': '#4ade80',
        'Discretionary.Entertainment': '#ff6b35',
        'Savings.Investment': '#7c6bff',
        'Essential.Transportation': '#4da6ff',
        'Essential.Housing': '#4da6ff',
    };
    return map[category] || '#8b9abe';
};

// ─── SubVampire Ghost Subscriptions (FM-02) ──────────────────
export const ghostSubscriptions = [
    {
        id: 'ghost_1',
        merchant: 'Fittr Premium',
        monthlyAmount: 299,
        annualWaste: 3588,
        ghostScore: 91,
        lastUsedDaysAgo: 62,
        status: 'DETECTED' as const,
        category: 'Fitness',
    },
    {
        id: 'ghost_2',
        merchant: 'Curiosity Stream',
        monthlyAmount: 199,
        annualWaste: 2388,
        ghostScore: 85,
        lastUsedDaysAgo: 45,
        status: 'DETECTED' as const,
        category: 'Education',
    },
    {
        id: 'ghost_3',
        merchant: 'Headspace',
        monthlyAmount: 449,
        annualWaste: 5388,
        ghostScore: 72,
        lastUsedDaysAgo: 34,
        status: 'DETECTED' as const,
        category: 'Wellness',
    },
];

export const ghostSummary = {
    totalMonthlyWaste: 947,
    totalAnnualWaste: 11364,
    ghostCount: 3,
    ghostFreeDays: 0,
    totalSavedThisYear: 3588, // from previously cancelled ghosts
};

// ─── Smart Nudge Pending Items ───────────────────────────────
export const smartNudges = [
    {
        transactionId: 'txn_nudge_1',
        merchantName: 'RAZORPAY*DECATHLONSP',
        amount: 2499,
        suggestedCategory: 'Discretionary.Shopping',
        suggestedConfidence: 0.72,
        alternatives: ['Discretionary.Fitness', 'Essential.Healthcare'],
        timeAgo: '15 min ago',
    },
    {
        transactionId: 'txn_nudge_2',
        merchantName: 'UPI-NEFT CR-HDFC0001234',
        amount: 850,
        suggestedCategory: 'Other.Transfer',
        suggestedConfidence: 0.45,
        alternatives: ['Essential.Bills', 'Essential.EMI', 'Savings.Investment'],
        timeAgo: '2 hours ago',
    },
];

// ─── SplitSync Active Splits (FM-01) ─────────────────────────
export const activeSplits = [
    {
        id: 'split_1',
        description: 'Chai at Third Wave Coffee',
        totalAmount: 900,
        payer: 'Arjun S.',
        participants: [
            { name: 'Priya M.', amount: 300, status: 'PAID' as const },
            { name: 'Amit K.', amount: 300, status: 'UNPAID' as const },
        ],
        status: 'PARTIAL' as const,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        xpRewardPerPerson: 15,
    },
    {
        id: 'split_2',
        description: 'Dinner at Barbeque Nation',
        totalAmount: 3200,
        payer: 'Sneha T.',
        participants: [
            { name: 'Arjun S.', amount: 800, status: 'PAID' as const },
            { name: 'Rohan K.', amount: 800, status: 'PAID' as const },
            { name: 'Karan J.', amount: 800, status: 'PAID' as const },
        ],
        status: 'SETTLED' as const,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        xpRewardPerPerson: 15,
    },
];

export const splitSyncStats = {
    totalSplits: 23,
    settledSplits: 21,
    onTimeRate: 0.94,
    totalSettled: 18500,
    splitStreak: 5,
};

// ─── Funding Pool Mock Data ──────────────────────────────────
export const fundingPools = [
    {
        id: 'pool_1',
        name: 'College Friends Savings',
        status: 'ACTIVE' as const,
        creator: 'Arjun S.',
        memberCount: 5,
        maxMembers: 10,
        totalDeposited: 25000,
        riskPool: 1200,
        minDeposit: 500,
        durationDays: 30,
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        members: [
            { name: 'Arjun S.', avatar: 'AS', deposited: 5000, safe: 4500, risk: 500, status: 'ACTIVE' as const },
            { name: 'Priya M.', avatar: 'PM', deposited: 8000, safe: 7200, risk: 800, status: 'ACTIVE' as const },
            { name: 'Rohan K.', avatar: 'RK', deposited: 4000, safe: 3600, risk: 400, status: 'ACTIVE' as const },
            { name: 'Sneha T.', avatar: 'ST', deposited: 6000, safe: 5400, risk: 600, status: 'ACTIVE' as const },
            { name: 'Karan J.', avatar: 'KJ', deposited: 2000, safe: 1800, risk: 200, status: 'WITHDRAWN' as const },
        ],
        myDeposit: 5000,
        mySafe: 4500,
        myRisk: 500,
    },
    {
        id: 'pool_2',
        name: 'Office Diwali Fund',
        status: 'COMPLETED' as const,
        creator: 'Priya M.',
        memberCount: 8,
        maxMembers: 10,
        totalDeposited: 40000,
        riskPool: 3000,
        minDeposit: 1000,
        durationDays: 60,
        startTime: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        members: [
            { name: 'Priya M.', avatar: 'PM', deposited: 6000, safe: 5400, risk: 600, status: 'COMPLETED' as const, payout: 6500 },
            { name: 'Amit D.', avatar: 'AD', deposited: 5000, safe: 4500, risk: 500, status: 'COMPLETED' as const, payout: 5420 },
            { name: 'Neha R.', avatar: 'NR', deposited: 3000, safe: 2700, risk: 300, status: 'WITHDRAWN' as const, payout: 2700 },
        ],
        myDeposit: 5000,
        mySafe: 4500,
        myRisk: 500,
    },
];
