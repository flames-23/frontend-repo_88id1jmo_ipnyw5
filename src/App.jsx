import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

function nextPowerOfTwo(n) {
  if (n < 1) return 1
  let p = 1
  while (p < n) p <<= 1
  return p
}

function generateBracketSlots(totalPlayers) {
  // Determine the main bracket size (power of two) and number of prelim matches
  const mainSize = nextPowerOfTwo(totalPlayers)
  const prelimPlayers = Math.max(0, 2 * (totalPlayers - (mainSize >> 1)))
  const prelimMatches = prelimPlayers / 2

  // Create placeholders for players
  const players = Array.from({ length: totalPlayers }, (_, i) => `Player ${i + 1}`)

  // If prelims exist, we create prelim pairings and remaining players get byes into main bracket
  const prelimPairs = []
  for (let i = 0; i < prelimPlayers; i += 2) {
    prelimPairs.push([players[i], players[i + 1]])
  }

  const advancedByes = players.slice(prelimPlayers) // these go straight into main bracket

  // Round structure: array of rounds, each round is array of matches [home, away]
  const rounds = []

  if (prelimMatches > 0) {
    rounds.push(
      prelimPairs.map((pair, idx) => ({
        id: `P${idx + 1}`,
        label: `Prelim ${idx + 1}`,
        teams: pair,
      }))
    )
  }

  // Compose first main round entries: winners of prelims + byes
  const entrantsForMain = []
  // winners placeholders from prelims
  for (let i = 0; i < prelimMatches; i++) {
    entrantsForMain.push(`Winner of Prelim ${i + 1}`)
  }
  // add byes
  entrantsForMain.push(...advancedByes)

  // First main round size = mainSize
  // If entrants fewer than mainSize (can happen when totalPlayers==mainSize), fill to mainSize
  while (entrantsForMain.length < mainSize) {
    entrantsForMain.push(`Player ${entrantsForMain.length + 1}`)
  }

  // Build main bracket rounds until champion
  let currentRoundEntrants = entrantsForMain
  let roundIndex = 1
  while (currentRoundEntrants.length > 1) {
    const matches = []
    for (let i = 0; i < currentRoundEntrants.length; i += 2) {
      const a = currentRoundEntrants[i]
      const b = currentRoundEntrants[i + 1] || 'BYE'
      matches.push({ id: `R${roundIndex}M${i / 2 + 1}`, label: `Round ${roundIndex}` , teams: [a, b] })
    }
    rounds.push(matches)
    currentRoundEntrants = matches.map((m, i) => `Winner of ${m.label} Match ${i + 1}`)
    roundIndex++
  }

  return { rounds, prelimMatches }
}

function BracketView({ rounds }) {
  return (
    <div className="d-flex flex-row overflow-auto py-3">
      {rounds.map((round, rIdx) => (
        <div key={rIdx} className="px-2" style={{ minWidth: 260 }}>
          <h6 className="text-center text-secondary mb-3">
            {round[0]?.label || `Round ${rIdx + 1}`}
          </h6>
          <div className="d-flex flex-column gap-3">
            {round.map((match) => (
              <div key={match.id} className="card shadow-sm border-0">
                <div className="card-body p-2">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                      <span className="fw-semibold text-truncate">{match.teams[0]}</span>
                      <span className="badge bg-primary">A</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                      <span className="fw-semibold text-truncate">{match.teams[1]}</span>
                      <span className="badge bg-secondary">B</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [inputText, setInputText] = useState('')
  const [participantCount, setParticipantCount] = useState(0)
  const [bracket, setBracket] = useState(null)

  const handleGenerate = () => {
    const lines = inputText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    const count = lines.length

    if (count <= 1) {
      setParticipantCount(0)
      setBracket(null)
      return
    }

    setParticipantCount(count)
    setBracket(generateBracketSlots(count))
  }

  const example = `Player A\nPlayer B\nPlayer C\nPlayer D\nPlayer E\nPlayer F\nPlayer G\nPlayer H\n...`

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">Tournament Bracket Generator</span>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Participants</h5>
                <p className="text-muted small mb-3">
                  Enter one name per line. For now we only use the total number.
                </p>
                <textarea
                  className="form-control"
                  rows={10}
                  placeholder={example}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div className="d-flex align-items-center gap-2 mt-3">
                  <button className="btn btn-primary" onClick={handleGenerate}>Generate Bracket</button>
                  {participantCount > 0 && (
                    <span className="text-muted">Count: <span className="fw-semibold">{participantCount}</span></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                {!bracket ? (
                  <div className="text-center text-muted py-5">
                    <p className="mb-0">Your bracket will appear here.</p>
                  </div>
                ) : (
                  <>
                    {bracket.prelimMatches > 0 && (
                      <div className="alert alert-info mb-3">
                        Automatically created {bracket.prelimMatches} preliminary match{bracket.prelimMatches>1?'es':''} to balance the bracket.
                      </div>
                    )}
                    <BracketView rounds={bracket.rounds} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-top bg-white py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <small className="text-muted">Clean Bootstrap 5 UI</small>
          <a className="btn btn-sm btn-outline-secondary" href="/test">Backend Test</a>
        </div>
      </footer>
    </div>
  )
}

export default App
