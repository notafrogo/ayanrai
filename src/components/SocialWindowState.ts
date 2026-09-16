export type Brand = 'github' | 'linkedin' | 'instagram' | 'email'

const compactViewport = typeof window !== 'undefined' && window.innerWidth <= 900

export const socialWindowDefaults = {
  github: { open: true, minimized: false, order: 4, position: { x: 0, y: compactViewport ? 20 : 100 } },
  linkedin: { open: true, minimized: false, order: 3, position: { x: compactViewport ? 0 : 620, y: compactViewport ? 245 : 100 } },
  instagram: { open: true, minimized: false, order: 2, position: { x: compactViewport ? 0 : 300, y: compactViewport ? 470 : 320 } },
  email: { open: true, minimized: false, order: 1, position: { x: compactViewport ? 0 : 600, y: compactViewport ? 695 : 320 } },
} satisfies Record<Brand, { open: boolean; minimized: boolean; order: number; position: { x: number; y: number } }>

export type SocialWindowState = typeof socialWindowDefaults

export const getStoredSocialWindows = (): SocialWindowState => {
  try {
    const stored = JSON.parse(localStorage.getItem('window_positions') ?? 'null') as (Partial<SocialWindowState> & { workspace?: string }) | null
    if (!stored || stored.workspace !== 'about-section-v2') return socialWindowDefaults

    return Object.keys(socialWindowDefaults).reduce((windows, brand) => {
      const key = brand as Brand
      const saved = stored[key]
      const position = saved?.position
      const savedPosition = !compactViewport && position && Number.isFinite(position.x) && Number.isFinite(position.y)
        ? position
        : socialWindowDefaults[key].position
      return {
        ...windows,
        [key]: {
          ...socialWindowDefaults[key],
          ...saved,
          position: savedPosition,
        },
      }
    }, {} as SocialWindowState)
  } catch {
    return socialWindowDefaults
  }
}
