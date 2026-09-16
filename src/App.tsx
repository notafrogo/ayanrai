import { useEffect, useRef, useState } from 'react'

import './App.css'
import SnakeGame from './components/SnakeGame'
import { BrandIcon, SocialWindow } from './components/SocialWindow'
import { getStoredSocialWindows, socialWindowDefaults } from './components/SocialWindowState'
import type { Brand, SocialWindowState } from './components/SocialWindowState'

type GitHubProfile = {
  avatar_url: string
  bio: string | null
  followers: number
  following: number
  login: string
  name: string | null
  public_repos: number
}
type GitHubRepo = {
  description: string | null
  forks_count: number
  html_url: string
  language: string | null
  name: string
  stargazers_count: number
  updated_at: string
}
type GitHubContribution = {
  count: number
  date: string
  level: number
}
type GitHubContributionData = {
  contributions: GitHubContribution[]
  total: { lastYear: number }
}

const formatRepoDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(date))

function App() {
  const [isSnakeManual, setIsSnakeManual] = useState(false)
  const [socialWindows, setSocialWindows] = useState<SocialWindowState>(getStoredSocialWindows)
  const [githubProfile, setGitHubProfile] = useState<GitHubProfile | null>(null)
  const [githubRepos, setGitHubRepos] = useState<GitHubRepo[]>([])
  const [githubContributions, setGitHubContributions] = useState<GitHubContributionData | null>(null)
  const aboutSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetch('https://api.github.com/users/notafrogo', { signal: controller.signal }),
      fetch('https://api.github.com/users/notafrogo/repos?sort=updated&per_page=4', { signal: controller.signal }),
    ])
      .then(async ([profileResponse, reposResponse]) => {
        if (!profileResponse.ok || !reposResponse.ok) throw new Error('GitHub data unavailable')
        return [await profileResponse.json() as GitHubProfile, await reposResponse.json() as GitHubRepo[]] as const
      })
      .then(([profile, repos]) => {
        setGitHubProfile(profile)
        setGitHubRepos(repos)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const focusSocialWindow = (brand: Brand) => {
    setSocialWindows((windows) => {
      const nextOrder = Math.max(...Object.values(windows).map((window) => window.order)) + 1
      return { ...windows, [brand]: { ...windows[brand], order: nextOrder } }
    })
  }

  const updateSocialWindow = (brand: Brand, changes: Partial<{ open: boolean; minimized: boolean }>) => {
    setSocialWindows((windows) => ({ ...windows, [brand]: { ...windows[brand], ...changes } }))
  }

  const updateSocialPosition = (brand: Brand, position: { x: number; y: number }) => {
    setSocialWindows((windows) => ({ ...windows, [brand]: { ...windows[brand], position } }))
  }

  const reopenSocialWindow = (brand: Brand) => {
    updateSocialWindow(brand, { open: true, minimized: false })
    focusSocialWindow(brand)
  }

  useEffect(() => {
    localStorage.setItem('window_positions', JSON.stringify({ ...socialWindows, workspace: 'about-section-v2' }))
  }, [socialWindows])

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://github-contributions-api.jogruber.de/v4/notafrogo?y=last', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('GitHub contributions unavailable')
        return response.json() as Promise<GitHubContributionData>
      })
      .then(setGitHubContributions)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const highestOrder = Math.max(...Object.values(socialWindows).map((window) => window.order))

  return (
    <main className="playground" aria-label="A portfolio with an interactive Snake background">
      <SnakeGame onControlModeChange={setIsSnakeManual} />
      <div className="portfolio-shell">
        <header className="portfolio-nav">
          <a className="monogram" href="/" aria-label="Ayan Rai home">AR</a>
          <nav aria-label="Main navigation"><a href="#about">About</a><a href="#work">Projects</a></nav>
        </header>

        {!isSnakeManual && <button className="control-toggle" type="button" aria-label="Enter Snake control mode" title="Enter Snake control mode" onClick={() => window.enterSnakeControl?.()}><span aria-hidden="true">⌨</span></button>}

        <section className="portfolio-intro">
          <p className="eyebrow">Mechanical Engineer / ECE & CS Enthusiast</p>
          <h1>Ayan Rai</h1>
          <p className="intro-copy">Motivated Mechanical Engineering freshman at WPI with hands-on experience in autonomous robotics, PID controllers, CAD, and C++/Python.</p>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-heading" ref={aboutSectionRef}>
          <div className="about-heading"><div><p className="eyebrow">About / contact</p><h2 id="about-heading">About Me</h2></div><span className="section-index">01</span></div>
          <div className="about-layout">
            <div className="about-details">
              <p className="eyebrow">Currently</p>
              <ul><li>WPI / Mechanical Engineering</li><li>Open to internships & research</li><li>Robotics / embedded systems / CAD</li></ul>
              {Object.entries(socialWindows).some(([, window]) => !window.open) && <div className="closed-apps" aria-label="Closed social windows"><div className="closed-app-dock">{(Object.keys(socialWindowDefaults) as Brand[]).map((brand) => !socialWindows[brand].open && <button className="closed-app" type="button" key={brand} onClick={() => reopenSocialWindow(brand)} aria-label={`Open ${brand}`} title={`Open ${brand}`}><BrandIcon brand={brand} /></button>)}</div></div>}
            </div>
            <div className="social-grid">
              {socialWindows.github.open && <SocialWindow brand="github" title="notafrogo (Ayan Rai)" href="https://github.com/notafrogo" className="social-card-github" position={socialWindows.github.position} workspaceRef={aboutSectionRef} isMinimized={socialWindows.github.minimized} isActive={socialWindows.github.order === highestOrder} onFocus={() => focusSocialWindow('github')} onPositionChange={(position) => updateSocialPosition('github', position)} onMinimize={() => updateSocialWindow('github', { minimized: !socialWindows.github.minimized })} onClose={() => updateSocialWindow('github', { open: false })}>
                <span className="social-platform"><BrandIcon brand="github" /> GitHub <a className="social-open-link" href="https://github.com/notafrogo" target="_blank" rel="noreferrer" aria-label="Open GitHub">↗</a></span><span className="profile-row"><img className="profile-avatar" src={githubProfile?.avatar_url ?? 'https://github.com/notafrogo.png?size=96'} alt={githubProfile?.name ?? 'Ayan Rai'} /><span className="profile-info"><strong>{githubProfile?.name ?? 'Ayan Rai'}</strong><em>@{githubProfile?.login ?? 'notafrogo'}</em></span></span><span className="profile-meta">{githubProfile?.bio ?? 'Public repositories'}</span>
              </SocialWindow>}
              {socialWindows.linkedin.open && <SocialWindow brand="linkedin" title="Ayan Rai | LinkedIn" href="https://www.linkedin.com/in/ayanrai/" className="social-card-linkedin" position={socialWindows.linkedin.position} workspaceRef={aboutSectionRef} isMinimized={socialWindows.linkedin.minimized} isActive={socialWindows.linkedin.order === highestOrder} onFocus={() => focusSocialWindow('linkedin')} onPositionChange={(position) => updateSocialPosition('linkedin', position)} onMinimize={() => updateSocialWindow('linkedin', { minimized: !socialWindows.linkedin.minimized })} onClose={() => updateSocialWindow('linkedin', { open: false })}>
                <span className="social-platform"><BrandIcon brand="linkedin" /> LinkedIn <a className="social-open-link" href="https://www.linkedin.com/in/ayanrai/" target="_blank" rel="noreferrer" aria-label="Open LinkedIn">↗</a></span><span className="profile-row"><span className="profile-avatar profile-avatar-blank" role="img" aria-label="Default blank LinkedIn profile picture" /><span className="profile-info"><strong>Ayan Rai</strong><em>ayanrai</em></span></span><span className="profile-meta">WPI · Mechanical Engineering</span>
              </SocialWindow>}
              {socialWindows.instagram.open && <SocialWindow brand="instagram" title="ayan rai (@ayanisdyin)" href="https://www.instagram.com/ayanisdyin/" className="social-card-instagram" position={socialWindows.instagram.position} workspaceRef={aboutSectionRef} isMinimized={socialWindows.instagram.minimized} isActive={socialWindows.instagram.order === highestOrder} onFocus={() => focusSocialWindow('instagram')} onPositionChange={(position) => updateSocialPosition('instagram', position)} onMinimize={() => updateSocialWindow('instagram', { minimized: !socialWindows.instagram.minimized })} onClose={() => updateSocialWindow('instagram', { open: false })}>
                <span className="social-platform"><BrandIcon brand="instagram" /> Instagram <a className="social-open-link" href="https://www.instagram.com/ayanisdyin/" target="_blank" rel="noreferrer" aria-label="Open Instagram">↗</a></span><span className="profile-row"><img className="profile-avatar" src="https://scontent-iad3-1.cdninstagram.com/v/t51.82787-19/612408440_18085399736321101_7950637346702355585_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=104&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=9rCVGy0c2AkQ7kNvwGkelOh&_nc_oc=AdpzF3uNgmB_P7MAOWmrcZsET9sRf_sbSB_AmP92-RNMryKqZcKT4vzv4pLtDC2Rlmk&_nc_zt=24&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=rrSxyaQqGF8u0HFM5kcOJw&_nc_ss=7b689&oh=00_AQKOWNOWz7uceuD5TfIBjWDYLURHQXtxez09mFuln3DjSA&oe=6AB06DAB" alt="ayan rai" /><span className="profile-info"><strong>ayan rai</strong><em>@ayanisdyin</em></span></span><span className="profile-meta">bay area<br />shs '26<br />wpi '30</span>
              </SocialWindow>}
              {socialWindows.email.open && <SocialWindow brand="email" title="Mail" href="mailto:ayanrai@notafrogo.com" className="social-card-email" position={socialWindows.email.position} workspaceRef={aboutSectionRef} isMinimized={socialWindows.email.minimized} isActive={socialWindows.email.order === highestOrder} onFocus={() => focusSocialWindow('email')} onPositionChange={(position) => updateSocialPosition('email', position)} onMinimize={() => updateSocialWindow('email', { minimized: !socialWindows.email.minimized })} onClose={() => updateSocialWindow('email', { open: false })}>
                <span className="social-platform"><BrandIcon brand="email" /> Email <a className="social-open-link" href="mailto:ayanrai@notafrogo.com" aria-label="Open email">↗</a></span><span className="profile-row"><span className="profile-avatar profile-avatar-initials">AR</span><span className="profile-info"><strong>Ayan Rai</strong><em>ayanrai@notafrogo.com</em></span></span><span className="profile-meta">Open to opportunities</span>
              </SocialWindow>}
            </div>
          </div>
        </section>

        <section className="portfolio-work github-work" id="work" aria-labelledby="github-heading">
          <div className="section-heading"><p className="eyebrow">Projects / GitHub</p><span>notafrogo ↗</span></div>
          <div className="github-embed">
            <div className="github-embed-header"><img className="github-embed-avatar" src={githubProfile?.avatar_url ?? 'https://github.com/notafrogo.png?size=160'} alt={githubProfile?.name ?? 'Ayan Rai'} /><div><h2 id="github-heading">{githubProfile?.name ?? 'Ayan Rai'}</h2><p>@{githubProfile?.login ?? 'notafrogo'}</p></div><a className="github-profile-link" href="https://github.com/notafrogo" target="_blank" rel="noreferrer">View profile ↗</a></div>
            <p className="github-bio">{githubProfile?.bio ?? 'Projects, experiments, and things I am building.'}</p>
            <div className="github-stats" aria-label="GitHub profile statistics"><span><strong>{githubProfile?.public_repos ?? '—'}</strong> repositories</span><span><strong>{githubProfile?.followers ?? '—'}</strong> followers</span><span><strong>{githubProfile?.following ?? '—'}</strong> following</span></div>
            <div className="contribution-section"><div className="contribution-heading"><strong>{githubContributions?.total.lastYear ?? 0} contributions in the last year</strong><span>Less <i className="contribution-level-0" /> <i className="contribution-level-1" /> <i className="contribution-level-2" /> <i className="contribution-level-3" /> <i className="contribution-level-4" /> More</span></div><div className="contribution-scroll"><div className="contribution-chart" aria-label="GitHub contribution calendar"><div className="weekday-labels" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div className="contribution-grid">{(githubContributions?.contributions ?? Array.from({ length: 371 }, (_, index) => ({ count: 0, date: `empty-${index}`, level: 0 }))).map((day) => <i className={`contribution-cell contribution-level-${day.level}`} key={day.date} title={day.date.startsWith('empty') ? 'No data' : `${day.count} contributions on ${day.date}`} />)}</div></div></div></div>
            <div className="repo-list">{githubRepos.length > 0 ? githubRepos.map((repo, index) => <a className="repo-row" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.name}><span className="repo-number">{String(index + 1).padStart(2, '0')}</span><span className="repo-main"><strong>{repo.name}</strong><span>{repo.description ?? 'No description provided.'}</span></span><span className="repo-details"><span>{repo.language ?? 'Code'}</span><span>★ {repo.stargazers_count}</span><span>⑂ {repo.forks_count}</span><span>{formatRepoDate(repo.updated_at)}</span></span><span className="repo-arrow" aria-hidden="true">↗</span></a>) : <p className="repo-empty">No public repositories found.</p>}</div>
          </div>
        </section>

        <footer className="portfolio-footer"><div className="footer-bottom"><span>© 2026 Ayan Rai</span><span>California / Massachusetts</span><div className="footer-links"><a href="https://github.com/notafrogo" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/ayanrai/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div></footer>
      </div>
    </main>
  )
}

export default App
