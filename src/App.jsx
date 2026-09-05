import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ModerationQueue from './pages/ModerationQueue';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-zinc-950 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route
              path="/queue"
              element={
                <ProtectedRoute>
                  <ModerationQueue />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirects to the queue */}
            <Route path="*" element={<Navigate to="/queue" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;