import { useEffect, useRef, useState } from 'react'

import './SnakeGame.css'

type Point = { x: number; y: number }
type AmbientStrategy = 'direct' | 'vertical' | 'horizontal'
type AmbientSnake = { direction: Point; segments: Point[]; strategy: AmbientStrategy }
type SnakeDirection = 'up' | 'down' | 'left' | 'right'
type ScrollState = {
  target: number
  frame: number | null
  lastProgrammaticY: number | null
}
type SnakeGameProps = {
  onControlModeChange?: (isManual: boolean) => void
}

declare global {
  interface Window {
    /** Take manual control; the next game tick moves in this direction. */
    controlSnake?: (direction: SnakeDirection) => void
    /** Enter manual control without changing the current direction. */
    enterSnakeControl?: () => void
    /** Trigger the normal fade-out and automatic restart sequence. */
    killSnake?: () => void
  }
}

const GRID_WIDTH = 48
const GRID_HEIGHT = 96
const TICK_MS = 145

const getPlayableGridHeight = () => {
  const footer = document.querySelector<HTMLElement>('.portfolio-footer')
  if (!footer) return GRID_HEIGHT

  const cellSize = Math.min(
    window.innerWidth / GRID_WIDTH,
    window.innerHeight / 30,
  )
  const worldTop = 0
  const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY
  const lastPlayableY = Math.floor((footerBottom - worldTop) / cellSize) - 1

  return Math.max(4, Math.min(GRID_HEIGHT, lastPlayableY + 2))
}

const wrapCoordinate = (value: number, limit: number) => {
  if (value <= 0) return limit - 2
  if (value >= limit - 1) return 1
  return value
}

const easeScrollTo = (target: number, state: ScrollState) => {
  state.target = target
  if (state.frame !== null) return

  const animate = () => {
    const distance = state.target - window.scrollY
    if (Math.abs(distance) < 0.5) {
      window.scrollTo(0, state.target)
      state.frame = null
      return
    }

    const nextScrollY = window.scrollY + distance * 0.1
    state.lastProgrammaticY = nextScrollY
    window.scrollTo(0, nextScrollY)
    state.frame = window.requestAnimationFrame(animate)
  }

  state.frame = window.requestAnimationFrame(animate)
}

const followUserSnake = (
  previous: Point,
  next: Point,
  direction: Point,
  gridHeight: number,
  scrollState: ScrollState,
) => {
  const cellSize = Math.min(
    window.innerWidth / GRID_WIDTH,
    window.innerHeight / 30,
  )
  const worldTop = 0

  if (direction.y === 1 && previous.y === gridHeight - 2 && next.y === 1) {
    easeScrollTo(Math.max(worldTop + cellSize - window.innerHeight * 0.5, 0), scrollState)
    return
  }

  const headTop = worldTop + next.y * cellSize
  const centeredTarget = headTop - window.innerHeight * 0.5
  const boundedTarget = Math.max(
    0,
    Math.min(
      centeredTarget,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  )
  easeScrollTo(boundedTarget, scrollState)
}

const samePoint = (first: Point, second: Point) =>
  first.x === second.x && first.y === second.y

const isOpenDirection = (
  head: Point,
  snake: Point[],
  direction: Point,
  gridHeight: number,
) => {
  const next = {
    x: wrapCoordinate(head.x + direction.x, GRID_WIDTH),
    y: wrapCoordinate(head.y + direction.y, gridHeight),
  }
  return !snake.some((segment) => samePoint(segment, next))
}

const chooseDirection = (
  head: Point,
  snake: Point[],
  apple: Point,
  current: Point,
  gridHeight: number,
) => {
  const towardApple: Point[] = []
  if (apple.x !== head.x) towardApple.push({ x: Math.sign(apple.x - head.x), y: 0 })
  if (apple.y !== head.y) towardApple.push({ x: 0, y: Math.sign(apple.y - head.y) })

  const fallback = [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
  ]

  return [...towardApple, current, ...fallback].find((candidate) => {
    const isReverse = candidate.x === -current.x && candidate.y === -current.y
    return !isReverse && isOpenDirection(head, snake, candidate, gridHeight)
  }) ?? current
}

const chooseAmbientDirection = (
  head: Point,
  snake: Point[],
  apple: Point,
  current: Point,
  gridHeight: number,
  strategy: AmbientStrategy,
) => {
  if (strategy === 'direct') return chooseDirection(head, snake, apple, current, gridHeight)

  const horizontal = apple.x !== head.x
    ? { x: Math.sign(apple.x - head.x), y: 0 }
    : null
  const vertical = apple.y !== head.y
    ? { x: 0, y: Math.sign(apple.y - head.y) }
    : null
  const towardApple = strategy === 'vertical'
    ? [vertical, horizontal]
    : [horizontal, vertical]
  const fallback = [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
  ]

  return [...towardApple, current, ...fallback].filter((candidate): candidate is Point => candidate !== null).find((candidate) => {
    const isReverse = candidate.x === -current.x && candidate.y === -current.y
    return !isReverse && isOpenDirection(head, snake, candidate, gridHeight)
  }) ?? current
}

const createSnake = (): Point[] => {
  const cellSize = Math.min(
    window.innerWidth / GRID_WIDTH,
    window.innerHeight / 30,
  )
  const visibleRows = Math.floor(window.innerHeight / cellSize)
  const maxSpawnY = Math.max(
    1,
    Math.min(GRID_HEIGHT - 2, visibleRows - 1),
  )
  const headX = Math.floor(Math.random() * 44) + 3
  const headY = Math.floor(Math.random() * maxSpawnY) + 1

  return [
    { x: headX, y: headY },
    { x: headX - 1, y: headY },
    { x: headX - 2, y: headY },
  ]
}

const createAmbientSnakes = (): AmbientSnake[] => {
  const strategies: AmbientStrategy[] = ['direct', 'vertical', 'horizontal']
  const directions: Point[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]

  return strategies.map((strategy, index) => ({
    direction: directions[index],
    segments: createSnake(),
    strategy,
  }))
}

const randomApple = (snake: Point[], gridHeight = GRID_HEIGHT): Point => {
  const openCells: Point[] = []

  for (let y = 1; y < gridHeight - 1; y += 1) {
    for (let x = 1; x < GRID_WIDTH - 1; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y })
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)]
}

function SnakeGame({ onControlModeChange }: SnakeGameProps) {
  const [snake, setSnake] = useState<Point[]>(createSnake)
  const [apple, setApple] = useState<Point>(() => randomApple(createSnake()))
  const [isDying, setIsDying] = useState(false)
  const [isTeleporting, setIsTeleporting] = useState(false)
  const [isUserControlled, setIsUserControlled] = useState(false)
  const [ambientSnakes, setAmbientSnakes] = useState<AmbientSnake[]>(createAmbientSnakes)
  const [appleEdge, setAppleEdge] = useState<'top' | 'bottom' | null>(null)
  const [round, setRound] = useState(0)
  const hasControlAccess = useRef(false)
  const konamiProgress = useRef<string[]>([])
  const snakeRef = useRef(snake)
  const ambientSnakesRef = useRef(ambientSnakes)
  const direction = useRef<Point>({ x: 1, y: 0 })
  const queuedDirection = useRef<Point | null>(null)
  const hasSynchronizedGrid = useRef(false)
  const scrollState = useRef<ScrollState>({
    target: 0,
    frame: null,
    lastProgrammaticY: null,
  })

  useEffect(() => {
    onControlModeChange?.(isUserControlled)
  }, [isUserControlled, onControlModeChange])

  useEffect(() => {
    snakeRef.current = snake
    ambientSnakesRef.current = ambientSnakes
  }, [ambientSnakes, snake])

  useEffect(() => {
    if (!isDying) return

    const restartTimer = window.setTimeout(() => {
      const nextSnake = createSnake()
      direction.current = { x: 1, y: 0 }
      queuedDirection.current = null
      setSnake(nextSnake)
      setApple(randomApple(nextSnake))
      setRound((currentRound) => currentRound + 1)
      setIsDying(false)
    }, 560)

    return () => window.clearTimeout(restartTimer)
  }, [isDying])

  useEffect(() => {
    if (!isTeleporting) return

    const frame = window.requestAnimationFrame(() => setIsTeleporting(false))
    return () => window.cancelAnimationFrame(frame)
  }, [isTeleporting])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAmbientSnakes((currentSnakes) => {
        const gridHeight = getPlayableGridHeight()
        const proposals = currentSnakes.map((ambientSnake) => {
          const head = ambientSnake.segments[0]
          const nextDirection = chooseAmbientDirection(
            head,
            ambientSnake.segments,
            apple,
            ambientSnake.direction,
            gridHeight,
            ambientSnake.strategy,
          )
          const nextHead = {
            x: wrapCoordinate(head.x + nextDirection.x, GRID_WIDTH),
            y: wrapCoordinate(head.y + nextDirection.y, gridHeight),
          }
          const nextSegments = [nextHead, ...ambientSnake.segments]

          return {
            direction: nextDirection,
            eatsApple: samePoint(nextHead, apple),
            nextHead,
            nextSegments,
          }
        })
        const collided = proposals.map((proposal) =>
          snakeRef.current.some((segment) => samePoint(segment, proposal.nextHead)),
        )

        proposals.forEach((proposal, index) => {
          proposals.forEach((otherProposal, otherIndex) => {
            if (index === otherIndex) return
            const hitsHead = samePoint(proposal.nextHead, otherProposal.nextHead)
            const hitsBody = currentSnakes[otherIndex].segments.some((segment) =>
              samePoint(segment, proposal.nextHead),
            )
            if (hitsHead || hitsBody) collided[index] = true
          })
        })

        const eaterIndex = proposals.findIndex((proposal, index) => proposal.eatsApple && !collided[index])
        if (eaterIndex !== -1) {
          const occupiedCells = [
            ...snakeRef.current,
            ...currentSnakes.flatMap((ambientSnake) => ambientSnake.segments),
            ...proposals[eaterIndex].nextSegments,
          ]
          setApple(randomApple(occupiedCells, gridHeight))
        }

        return proposals.map((proposal, index) => {
          if (collided[index]) {
            return {
              direction: { x: -proposal.direction.x, y: -proposal.direction.y },
              segments: currentSnakes[index].segments,
              strategy: currentSnakes[index].strategy,
            }
          }
          return {
            direction: proposal.direction,
            segments: proposal.eatsApple ? proposal.nextSegments : proposal.nextSegments.slice(0, -1),
            strategy: currentSnakes[index].strategy,
          }
        })
      })
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [apple])

  useEffect(() => {
    const updateAppleEdge = () => {
      const cellSize = Math.min(
        window.innerWidth / GRID_WIDTH,
        window.innerHeight / 30,
      )
      const appleTop = apple.y * cellSize
      const viewportTop = window.scrollY
      const viewportBottom = viewportTop + window.innerHeight

      if (!isUserControlled) {
        setAppleEdge(null)
      } else if (appleTop < viewportTop) {
        setAppleEdge('top')
      } else if (appleTop + cellSize > viewportBottom) {
        setAppleEdge('bottom')
      } else {
        setAppleEdge(null)
      }
    }

    updateAppleEdge()
    window.addEventListener('scroll', updateAppleEdge, { passive: true })
    window.addEventListener('resize', updateAppleEdge)
    return () => {
      window.removeEventListener('scroll', updateAppleEdge)
      window.removeEventListener('resize', updateAppleEdge)
    }
  }, [apple, isUserControlled])

  useEffect(() => {
    const directionMap: Record<SnakeDirection, Point> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }
    const keyDirectionMap: Record<string, SnakeDirection> = {
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    }
    const konamiCode = [
      'arrowup',
      'arrowup',
      'arrowdown',
      'arrowdown',
      'arrowleft',
      'arrowright',
      'arrowleft',
      'arrowright',
      'b',
      'a',
    ]
    const controlSnake = (nextDirection: SnakeDirection) => {
      if (!hasControlAccess.current) return

      const requested = directionMap[nextDirection]
      if (
        requested.x === -direction.current.x &&
        requested.y === -direction.current.y
      ) return
      if (queuedDirection.current !== null) return

      queuedDirection.current = requested
      setIsUserControlled(true)
    }
    const enterControlMode = () => {
      hasControlAccess.current = true
      setIsUserControlled(true)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const nextDirection = keyDirectionMap[key]

      if (key === konamiCode[konamiProgress.current.length]) {
        konamiProgress.current.push(key)
        if (konamiProgress.current.length === konamiCode.length) {
          konamiProgress.current = []
          enterControlMode()
        }
        event.preventDefault()
        return
      }

      konamiProgress.current = key === konamiCode[0] ? [key] : []
      if (!nextDirection) return

      event.preventDefault()
      controlSnake(nextDirection)
    }
    const killSnake = () => setIsDying(true)

    window.controlSnake = controlSnake
    window.enterSnakeControl = enterControlMode
    window.killSnake = killSnake
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      delete window.controlSnake
      delete window.enterSnakeControl
      delete window.killSnake
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!isUserControlled) return

      const { frame, lastProgrammaticY } = scrollState.current
      const isFollowScroll =
        frame !== null &&
        lastProgrammaticY !== null &&
        Math.abs(window.scrollY - lastProgrammaticY) < 1

      if (isFollowScroll) return

      if (frame !== null) {
        window.cancelAnimationFrame(frame)
        scrollState.current.frame = null
      }
      scrollState.current.lastProgrammaticY = null
      queuedDirection.current = null
      setIsUserControlled(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isUserControlled])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        if (isDying) return currentSnake

        const head = currentSnake[0]
        const gridHeight = getPlayableGridHeight()
        if (!hasSynchronizedGrid.current) {
          hasSynchronizedGrid.current = true
          setApple(randomApple(currentSnake, gridHeight))
          return currentSnake
        }
        if (!isUserControlled) {
          direction.current = chooseDirection(
            head,
            currentSnake,
            apple,
            direction.current,
            gridHeight,
          )
        } else if (queuedDirection.current !== null) {
          direction.current = queuedDirection.current
          queuedDirection.current = null
        }
        const nextHead = {
          x: wrapCoordinate(head.x + direction.current.x, GRID_WIDTH),
          y: wrapCoordinate(head.y + direction.current.y, gridHeight),
        }
        const didTeleport =
          Math.abs(nextHead.x - head.x) > 1 || Math.abs(nextHead.y - head.y) > 1
        if (didTeleport) setIsTeleporting(true)
        if (isUserControlled) {
          followUserSnake(
            head,
            nextHead,
            direction.current,
            gridHeight,
            scrollState.current,
          )
        }
        const hitSelf = currentSnake.some((segment) =>
          samePoint(segment, nextHead),
        )
        const hitAmbientSnake = ambientSnakesRef.current.some((ambientSnake) =>
          ambientSnake.segments.some((segment) => samePoint(segment, nextHead)),
        )

        if (hitSelf || hitAmbientSnake) {
          window.killSnake?.()
          return currentSnake
        }

        const nextSnake = [nextHead, ...currentSnake]
        if (samePoint(nextHead, apple)) {
          setApple(randomApple(nextSnake, gridHeight))
          return nextSnake
        }

        nextSnake.pop()
        return nextSnake
      })
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [apple, isDying, isUserControlled])

  return (
    <>
      <div className="game-grid" aria-hidden="true">
        <div className="grid-lines" />
        <div
          className={`apple ${isDying ? 'is-dying' : ''}`}
          style={{ '--x': apple.x, '--y': apple.y } as React.CSSProperties}
        >
          <span />
        </div>
        <div
          className={`snake ${isDying ? 'is-dying' : ''} ${isTeleporting ? 'is-teleporting' : ''}`}
          key={round}
        >
          {snake.map((segment, index) => (
            <span
              className={`segment ${index === 0 ? 'head' : ''}`}
              key={`${segment.x}-${segment.y}-${index}`}
              style={{ '--x': segment.x, '--y': segment.y } as React.CSSProperties}
            />
          ))}
        </div>
        {ambientSnakes.map((ambientSnake, snakeIndex) => (
          <div className={`snake ambient-snake ambient-snake-${snakeIndex}`} key={`ambient-${snakeIndex}`}>
            {ambientSnake.segments.map((segment, segmentIndex) => (
              <span
                className={`segment ${segmentIndex === 0 ? 'head' : ''}`}
                key={`ambient-${snakeIndex}-${segment.x}-${segment.y}-${segmentIndex}`}
                style={{ '--x': segment.x, '--y': segment.y } as React.CSSProperties}
              />
            ))}
          </div>
        ))}
      </div>
      {isUserControlled && appleEdge && (
        <span
          className={`apple-edge-indicator apple-edge-indicator-${appleEdge}`}
          aria-hidden="true"
          style={{ '--x': apple.x } as React.CSSProperties}
        >!
        </span>
      )}
    </>
  )
}

export default SnakeGame
