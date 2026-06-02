import { adminDb } from './firebase/admin'

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: string
  actionText?: string
}

export interface TutorialSession {
  userId: string
  tutorialId: string
  completedSteps: string[]
  currentStep: number
  startedAt: string
  completedAt?: string
  skipped: boolean
}

export const TUTORIALS = {
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard Overview',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to CalRoute',
        description: 'This is your dashboard where you can manage all your bookings and settings.',
        targetSelector: '[data-tutorial="dashboard-header"]',
        position: 'bottom',
      },
      {
        id: 'bookings',
        title: 'Manage Your Bookings',
        description: 'View and manage all your bookings here. You can cancel or reschedule them.',
        targetSelector: '[data-tutorial="bookings-card"]',
        position: 'left',
      },
      {
        id: 'links',
        title: 'Create Booking Links',
        description: 'Share booking links with your customers to let them book appointments.',
        targetSelector: '[data-tutorial="links-card"]',
        position: 'left',
      },
      {
        id: 'settings',
        title: 'Customize Your Settings',
        description: 'Set your availability, time zone, and other preferences.',
        targetSelector: '[data-tutorial="settings-card"]',
        position: 'left',
      },
    ],
  },
  bookingForm: {
    id: 'bookingForm',
    title: 'Create a Booking Link',
    steps: [
      {
        id: 'title',
        title: 'Add a Title',
        description: 'Give your booking link a descriptive title like "30-min Consultation"',
        targetSelector: 'input[name="title"]',
        position: 'bottom',
      },
      {
        id: 'duration',
        title: 'Set Duration',
        description: 'Choose how long each booking should be.',
        targetSelector: 'input[name="duration"]',
        position: 'bottom',
      },
      {
        id: 'availability',
        title: 'Set Your Availability',
        description: 'Choose which days and times you are available for bookings.',
        targetSelector: '[data-tutorial="availability-section"]',
        position: 'top',
      },
    ],
  },
} as const

export async function startTutorial(userId: string, tutorialId: string) {
  try {
    await adminDb.collection('tutorial_sessions').add({
      userId,
      tutorialId,
      completedSteps: [],
      currentStep: 0,
      startedAt: new Date().toISOString(),
      skipped: false,
    })
    return true
  } catch (error) {
    console.error('[tutorial] error starting:', error)
    return false
  }
}

export async function completeTutorialStep(userId: string, tutorialId: string, stepId: string) {
  try {
    const snap = await adminDb
      .collection('tutorial_sessions')
      .where('userId', '==', userId)
      .where('tutorialId', '==', tutorialId)
      .get()

    if (snap.empty) return false

    const session = snap.docs[0]
    const data = session.data() as TutorialSession

    await session.ref.update({
      completedSteps: [...data.completedSteps, stepId],
      currentStep: data.currentStep + 1,
    })

    return true
  } catch (error) {
    console.error('[tutorial] error completing step:', error)
    return false
  }
}

export async function skipTutorial(userId: string, tutorialId: string) {
  try {
    const snap = await adminDb
      .collection('tutorial_sessions')
      .where('userId', '==', userId)
      .where('tutorialId', '==', tutorialId)
      .get()

    if (snap.empty) return false

    await snap.docs[0].ref.update({
      skipped: true,
      completedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('[tutorial] error skipping:', error)
    return false
  }
}
