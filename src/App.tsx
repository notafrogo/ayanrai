import { useEffect, useState } from 'react'

import './App.css'
import SnakeGame from './SnakeGame'

type Brand = 'github' | 'linkedin' | 'instagram' | 'email'
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

const BrandIcon = ({ brand }: { brand: Brand }) => {
  if (brand === 'github') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
      </svg>
    )
  }

  if (brand === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M5.16 7.08A1.92 1.92 0 1 1 5.16 3.24a1.92 1.92 0 0 1 0 3.84ZM3.5 8.5h3.32V20H3.5V8.5Zm5.4 0H12v1.57h.05c.49-.93 1.68-1.9 3.46-1.9 3.7 0 4.38 2.43 4.38 5.59V20h-3.32v-5.52c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92V20H8.9V8.5Z" />
      </svg>
    )
  }

  if (brand === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.7" r="1" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

const formatRepoDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(date))

function App() {
  const [isSnakeManual, setIsSnakeManual] = useState(false)
  const [githubProfile, setGitHubProfile] = useState<GitHubProfile | null>(null)
  const [githubRepos, setGitHubRepos] = useState<GitHubRepo[]>([])
  const [githubContributions, setGitHubContributions] = useState<GitHubContributionData | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetch('https://api.github.com/users/notafrogo', { signal: controller.signal }),
      fetch('https://api.github.com/users/notafrogo/repos?sort=updated&per_page=4', { signal: controller.signal }),
    ])
      .then(async ([profileResponse, reposResponse]) => {
        if (!profileResponse.ok || !reposResponse.ok) throw new Error('GitHub data unavailable')
        return [
          await profileResponse.json() as GitHubProfile,
          await reposResponse.json() as GitHubRepo[],
        ] as const
      })
      .then(([profile, repos]) => {
        setGitHubProfile(profile)
        setGitHubRepos(repos)
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

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

  return (
    <main className="playground" aria-label="A portfolio with an interactive Snake background">
      <SnakeGame onControlModeChange={setIsSnakeManual} />
      <div className="portfolio-shell">
        <header className="portfolio-nav">
          <a className="monogram" href="/" aria-label="Ayan Rai home">AR</a>
          <nav aria-label="Main navigation">
            <a href="#about">About</a>
            <a href="#work">Projects</a>
          </nav>
        </header>

        {!isSnakeManual && (
          <button
            className="control-toggle"
            type="button"
            aria-label="Enter Snake control mode"
            title="Enter Snake control mode"
            onClick={() => window.enterSnakeControl?.()}
          >
            <span aria-hidden="true">⌨</span>
          </button>
        )}

        <section className="portfolio-intro">
          <p className="eyebrow">Mechanical Engineer / ECE & CS Enthusiast</p>
          <h1>Ayan Rai</h1>
          <p className="intro-copy">Motivated Mechanical Engineering freshman at WPI with hands-on experience in autonomous robotics, PID controllers, CAD, and C++/Python.</p>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-heading">
          <div className="about-heading">
            <div>
              <p className="eyebrow">About / contact</p>
              <h2 id="about-heading">About Me</h2>
            </div>
            <span className="section-index">01</span>
          </div>
          <div className="about-layout">
            <div className="about-details">
              <p className="eyebrow">Currently</p>
              <ul>
                <li>WPI / Mechanical Engineering</li>
                <li>Open to internships & research</li>
                <li>Robotics / embedded systems / CAD</li>
              </ul>
            </div>
            <div className="social-grid">
              <a className="social-card social-card-github" href="https://github.com/notafrogo" target="_blank" rel="noreferrer">
                <span className="social-platform"><BrandIcon brand="github" /> GitHub <span>↗</span></span>
                <span className="profile-row">
                  <img className="profile-avatar" src={githubProfile?.avatar_url ?? 'https://github.com/notafrogo.png?size=96'} alt={githubProfile?.name ?? 'Ayan Rai'} />
                  <span className="profile-info"><strong>{githubProfile?.name ?? 'Ayan Rai'}</strong><em>@{githubProfile?.login ?? 'notafrogo'}</em></span>
                </span>
                <span className="profile-meta">{githubProfile?.bio ?? 'Public repositories'}</span>
              </a>
              <a className="social-card social-card-linkedin" href="https://www.linkedin.com/in/ayanrai/" target="_blank" rel="noreferrer">
                <span className="social-platform"><BrandIcon brand="linkedin" /> LinkedIn <span>↗</span></span>
                <span className="profile-row">
                  <span className="profile-avatar profile-avatar-blank" role="img" aria-label="Default blank LinkedIn profile picture" />
                  <span className="profile-info"><strong>Ayan Rai</strong><em>ayanrai</em></span>
                </span>
                <span className="profile-meta">WPI · Mechanical Engineering</span>
              </a>
              <a className="social-card social-card-instagram" href="https://www.instagram.com/ayanisdyin/" target="_blank" rel="noreferrer">
                <span className="social-platform"><BrandIcon brand="instagram" /> Instagram <span>↗</span></span>
                <span className="profile-row">
                  <img className="profile-avatar" src="https://scontent-iad3-1.cdninstagram.com/v/t51.82787-19/612408440_18085399736321101_7950637346702355585_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=104&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=9rCVGy0c2AkQ7kNvwGkelOh&_nc_oc=AdpzF3uNgmB_P7MAOWmrcZsET9sRf_sbSB_AmP92-RNMryKqZcKT4vzv4pLtDC2Rlmk&_nc_zt=24&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=rrSxyaQqGF8u0HFM5kcOJw&_nc_ss=7b689&oh=00_AQKOWNOWz7uceuD5TfIBjWDYLURHQXtxez09mFuln3DjSA&oe=6AB06DAB" alt="ayan rai" />
                  <span className="profile-info"><strong>ayan rai</strong><em>@ayanisdyin</em></span>
                </span>
                <span className="profile-meta">bay area<br />shs '26<br />wpi '30</span>
              </a>
              <a className="social-card social-card-email" href="mailto:ayanrai@notafrogo.com">
                <span className="social-platform"><BrandIcon brand="email" /> Email <span>↗</span></span>
                <span className="profile-row">
                  <span className="profile-avatar profile-avatar-initials">AR</span>
                  <span className="profile-info"><strong>Ayan Rai</strong><em>ayanrai@notafrogo.com</em></span>
                </span>
                <span className="profile-meta">Open to opportunities</span>
              </a>
            </div>
          </div>
        </section>

        <section className="portfolio-work github-work" id="work" aria-labelledby="github-heading">
          <div className="section-heading">
            <p className="eyebrow">GitHub / projects</p>
            <span>notafrogo ↗</span>
          </div>
          <div className="github-embed">
            <div className="github-embed-header">
              <img className="github-embed-avatar" src={githubProfile?.avatar_url ?? 'https://github.com/notafrogo.png?size=160'} alt={githubProfile?.name ?? 'Ayan Rai'} />
              <div>
                <h2 id="github-heading">{githubProfile?.name ?? 'Ayan Rai'}</h2>
                <p>@{githubProfile?.login ?? 'notafrogo'}</p>
              </div>
              <a className="github-profile-link" href="https://github.com/notafrogo" target="_blank" rel="noreferrer">View profile ↗</a>
            </div>
            <p className="github-bio">{githubProfile?.bio ?? 'Projects, experiments, and things I am building.'}</p>
            <div className="github-stats" aria-label="GitHub profile statistics">
              <span><strong>{githubProfile?.public_repos ?? '—'}</strong> repositories</span>
              <span><strong>{githubProfile?.followers ?? '—'}</strong> followers</span>
              <span><strong>{githubProfile?.following ?? '—'}</strong> following</span>
            </div>
            <div className="contribution-section">
              <div className="contribution-heading">
                <strong>{githubContributions?.total.lastYear ?? 0} contributions in the last year</strong>
                <span>Less <i className="contribution-level-0" /> <i className="contribution-level-1" /> <i className="contribution-level-2" /> <i className="contribution-level-3" /> <i className="contribution-level-4" /> More</span>
              </div>
              <div className="contribution-scroll">
                <div className="contribution-chart" aria-label="GitHub contribution calendar">
                  <div className="weekday-labels" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
                  <div className="contribution-grid">
                    {(githubContributions?.contributions ?? Array.from({ length: 371 }, (_, index) => ({ count: 0, date: `empty-${index}`, level: 0 }))).map((day) => (
                      <i className={`contribution-cell contribution-level-${day.level}`} key={day.date} title={day.date.startsWith('empty') ? 'No data' : `${day.count} contributions on ${day.date}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="repo-list">
              {githubRepos.length > 0 ? githubRepos.map((repo, index) => (
                <a className="repo-row" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.name}>
                  <span className="repo-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="repo-main">
                    <strong>{repo.name}</strong>
                    <span>{repo.description ?? 'No description provided.'}</span>
                  </span>
                  <span className="repo-details">
                    <span>{repo.language ?? 'Code'}</span>
                    <span>★ {repo.stargazers_count}</span>
                    <span>⑂ {repo.forks_count}</span>
                    <span>{formatRepoDate(repo.updated_at)}</span>
                  </span>
                  <span className="repo-arrow" aria-hidden="true">↗</span>
                </a>
              )) : (
                <p className="repo-empty">No public repositories found.</p>
              )}
            </div>
          </div>
        </section>

        <footer className="portfolio-footer">
          <span>© 2026 Ayan Rai</span>
          <a href="mailto:ayanrai@notafrogo.com">ayanrai@notafrogo.com</a>
          <span>New York / Everywhere</span>
        </footer>
      </div>
    </main>
  )
}

export default App
