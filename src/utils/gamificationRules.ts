export interface GamificationRules {
  CHAT_MESSAGE_POINTS: number;
  TRAINING_COMPLETION_POINTS: number;
  CORRECT_PHISHING_IDENTIFICATION: number;
  BADGE_UNLOCK_BONUS: number;
  DAILY_STREAK_BONUS: number;
  REFERRAL_BONUS: number;
}

export const gamificationRules: GamificationRules = {
  CHAT_MESSAGE_POINTS: 5,
  TRAINING_COMPLETION_POINTS: 150,
  CORRECT_PHISHING_IDENTIFICATION: 50,
  BADGE_UNLOCK_BONUS: 100,
  DAILY_STREAK_BONUS: 25,
  REFERRAL_BONUS: 200,
};

export const calculateTotalPoints = (activities: {
  chatMessages: number;
  trainingsCompleted: number;
  correctPhishingIdentifications: number;
  badgesUnlocked: number;
  dailyStreaks: number;
  referrals: number;
}): number => {
  return (
    activities.chatMessages * gamificationRules.CHAT_MESSAGE_POINTS +
    activities.trainingsCompleted * gamificationRules.TRAINING_COMPLETION_POINTS +
    activities.correctPhishingIdentifications * gamificationRules.CORRECT_PHISHING_IDENTIFICATION +
    activities.badgesUnlocked * gamificationRules.BADGE_UNLOCK_BONUS +
    activities.dailyStreaks * gamificationRules.DAILY_STREAK_BONUS +
    activities.referrals * gamificationRules.REFERRAL_BONUS
  );
};

export const getRank = (points: number, totalUsers: number): number => {
  // Calculate rank based on points and total users
  return Math.max(1, Math.ceil((1 - points / (points + totalUsers)) * totalUsers));
};
