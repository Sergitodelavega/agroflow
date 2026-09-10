import { type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "./lib/store";
import { RoleProvider, PERMISSIONS } from "./lib/role";
import { AuthProvider, useAuth } from "./lib/auth";
import { useTheme } from "./lib/theme";
import { AppShell } from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import LotsList from "./pages/LotsList";
import LotCreate from "./pages/LotCreate";
import Compatibility from "./pages/Compatibility";
import OperationDetail from "./pages/OperationDetail";
import Passport from "./pages/Passport";
import FlowMap from "./pages/FlowMap";
import OperationsList from "./pages/OperationsList";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import PageTransition from "./components/PageTransition";

function ThemeBoot({ children }: { children: ReactNode }) {
  useTheme();
  return children;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (
            <AppShell>
              <Dashboard />
            </AppShell>
          ) : (
            <PageTransition k="accueil">
              <Landing />
            </PageTransition>
          )
        }
      />
      <Route
        path="/connexion"
        element={
          session ? (
            <Navigate to={PERMISSIONS[session.role].home} replace />
          ) : (
            <PageTransition k="connexion">
              <Login />
            </PageTransition>
          )
        }
      />
      <Route
        path="/passeport/:id"
        element={
          session ? (
            <AppShell>
              <Passport />
            </AppShell>
          ) : (
            <div className="min-h-full bg-background p-5 lg:p-7">
              <PageTransition>
                <Passport />
              </PageTransition>
            </div>
          )
        }
      />
      <Route
        path="*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/operations" element={<OperationsList />} />
                <Route path="/lots" element={<LotsList />} />
                <Route path="/creer" element={<LotCreate />} />
                <Route path="/compatibilite" element={<Compatibility />} />
                <Route path="/operation/:id" element={<OperationDetail />} />
                <Route path="/carte" element={<FlowMap />} />
                <Route path="*" element={<Navigate to={session ? PERMISSIONS[session.role].home : "/connexion"} replace />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <RoleProvider>
          <ThemeBoot>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </ThemeBoot>
        </RoleProvider>
      </AuthProvider>
    </StoreProvider>
  );
}
