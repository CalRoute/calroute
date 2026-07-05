export interface UserBillingDoc {
  subscriptionId: string | null
  tier: 'free_trial' | 'solo' | 'team_member' | 'vip'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
  stripeCustomerId: string | null
  teamId: string | null
  crossoverCouponActive?: boolean
}

export interface TeamBillingDoc {
  subscriptionId: string
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'expired'
  currentSeats: number
  stripeCustomerId: string
  adminOwnerId: string
}
