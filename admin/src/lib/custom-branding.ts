import { adminDb } from './firebase/admin'

export interface BrandingConfig {
  userId: string
  companyName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  customDomain?: string
  createdAt: string
  updatedAt: string
}

export async function setBrandingConfig(userId: string, config: Omit<BrandingConfig, 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const existingSnap = await adminDb.collection('branding').doc(userId).get()
    const existingData = existingSnap.exists ? existingSnap.data() : null

    await adminDb.collection('branding').doc(userId).set({
      userId,
      ...config,
      updatedAt: new Date().toISOString(),
      createdAt: existingData?.createdAt || new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error('[branding] error setting config:', error)
    return false
  }
}

export async function getBrandingConfig(userId: string): Promise<BrandingConfig | null> {
  try {
    const snap = await adminDb.collection('branding').doc(userId).get()
    return (snap.data() as BrandingConfig) || null
  } catch (error) {
    console.error('[branding] error getting config:', error)
    return null
  }
}

export async function getAllBrandingConfigs() {
  try {
    const snap = await adminDb.collection('branding').get()
    return snap.docs.map(d => d.data() as BrandingConfig)
  } catch (error) {
    console.error('[branding] error getting all configs:', error)
    return []
  }
}

export async function deleteBrandingConfig(userId: string) {
  try {
    await adminDb.collection('branding').doc(userId).delete()
    return true
  } catch (error) {
    console.error('[branding] error deleting config:', error)
    return false
  }
}
