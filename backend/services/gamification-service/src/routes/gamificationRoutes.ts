import { Router } from 'express';
import { GamificationController } from '../controllers/GamificationController';
import { SplitSyncController } from '../controllers/SplitSyncController';
import { FundingPoolController } from '../controllers/FundingPoolController';

const router = Router();

// Challenges
router.get('/challenges/:userId', GamificationController.getChallenges);
router.post('/challenges/:userId/:challengeId/stake', GamificationController.stakeChallenge);
router.get('/challenges/:userId/history', GamificationController.getChallengeHistory);

// Squads
router.post('/squads', GamificationController.createSquad);
router.post('/squads/:squadId/join', GamificationController.joinSquad);
router.get('/squads/:squadId', GamificationController.getSquad);

// Leagues & Badges (Stubs)
router.get('/leagues/:userId', GamificationController.getLeague);
router.get('/badges/:userId', GamificationController.getBadges);

// Streaks
router.get('/streaks/:userId', GamificationController.getStreaks);
router.post('/streaks/:userId/freeze', GamificationController.freezeStreak);

// ─── SplitSync Routes ───
router.post('/splits', SplitSyncController.createSplit);
router.post('/splits/:splitId/payments/:participantId', SplitSyncController.recordPayment);
router.get('/splits/user/:userId', SplitSyncController.getUserSplits);
router.get('/splits/user/:userId/active', SplitSyncController.getActiveSplits);
router.post('/splits/:splitId/remind', SplitSyncController.sendReminders);
router.post('/splits/:splitId/cancel', SplitSyncController.cancelSplit);

// ─── Funding Pool Routes ───
router.post('/pools', FundingPoolController.createPool);
router.post('/pools/:poolId/join', FundingPoolController.joinPool);
router.post('/pools/:poolId/deposit', FundingPoolController.deposit);
router.post('/pools/:poolId/withdraw', FundingPoolController.earlyWithdraw);
router.post('/pools/:poolId/distribute', FundingPoolController.distributePool);
router.get('/pools/:poolId', FundingPoolController.getPool);
router.get('/pools/user/:userId', FundingPoolController.getUserPools);

export default router;
