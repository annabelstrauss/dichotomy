import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import CreateGame from './screens/CreateGame'
import JoinGame from './screens/JoinGame'
import GameBoard from './screens/GameBoard'

// Route /g/:code → join if no session, else board
function GameRoute() {
  const { code } = useParams()
  const playerId = sessionStorage.getItem(`player_${code}`)

  // Everyone (including host) goes through the join form before reaching the board
  if (playerId) return <GameBoard />
  return <JoinGame />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateGame />} />
        <Route path="/g/:code" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
