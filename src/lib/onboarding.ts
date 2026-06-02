import { adminDb } from './firebase/admin'

export type OnboardingStep =
  | 'profile_setup'
  | 'calendar_connected'
  | 'booking_link_created'
  | 'first_booking'
  | 'customization_done'

export interface OnboardingProgress {
  userId: string
  completedSteps: OnboardingStep[]
  currentStep: OnboardingStep
  startedAt: string
  completedAt?: string
  skipped: boolean
}

export async function initializeOnboarding(userId: string) {
  try {
    await adminDb.collection('onboarding_progress').doc(userId).set({
      userId,
      completedSteps: [],
      currentStep: 'profile_setup',
      startedAt: new Date().toISOString(),
      skipped: false,
    })
    return true
  } catch (error) {
    console.error('[onboarding] error initializing:', error)
    return false
  }
}

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const snap = await adminDb.collection('onboarding_progress').doc(userId).get()
    return (snap.data() as OnboardingProgress) || null
  } catch (error) {
    console.error('[onboarding] error getting progress:', error)
    return null
  }
}

export async function completeOnboardingStep(userId: string, step: OnboardingStep) {
  try {
    const progress = await getOnboardingProgress(userId)

    if (!progress) {
      await initializeOnboarding(userId)
    }

    const steps = progress?.completedSteps || []
    if (!steps.includes(step)) {
      steps.push(step)
    }

    const nextSteps: Record<OnboardingStep, OnboardingStep> = {
      profile_setup: 'calendar_connected',
      calendar_connected: 'booking_link_created',
      booking_link_created: 'first_booking',
      first_booking: 'customization_done',
      customization_done: 'customization_done',
    }

    await adminDb.collection('onboarding_progress').doc(userId).update({
      completedSteps: steps,
      currentStep: nextSteps[step],
      ...(step === 'customization_done' && { completedAt: new Date().toISOString() }),
    })

    return true
  } catch (error) {
    console.error('[onboarding] error completing step:', error)
    return false
  }
}

export async function skipOnboarding(userId: string) {
  try {
    await adminDb.collection('onboarding_progress').doc(userId).update({
      skipped: true,
      completedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('[onboarding] error skipping:', error)
    return false
  }
}

export async function getOnboardingStats() {
  try {
    const snap = await adminDb.collection('onboarding_progress').get()
    const progresses = snap.docs.map(d => d.data() as OnboardingProgress)

    return {
      totalStarted: progresses.length,
      completed: progresses.filter(p => p.completedAt).length,
      skipped: progresses.filter(p => p.skipped).length,
      completionRate:
        progresses.length > 0 ? ((progresses.filter(p => p.completedAt).length / progresses.length) * 100).toFixed(1) : '0',
      averageTimeToComplete: calculateAverageTime(progresses),
    }
  } catch (error) {
    console.error('[onboarding] error getting stats:', error)
    return null
  }
}

function calculateAverageTime(progresses: OnboardingProgress[]): string {
  const completed = progresses.filter(p => p.completedAt)
  if (completed.length === 0) return '0'

  const times = completed.map(p => {
    const start = new Date(p.startedAt).getTime()
    const end = new Date(p.completedAt!).getTime()
    return (end - start) / (1000 * 60) // minutes
  })

  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  return `${avg}m`
}
