import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  allowed: boolean
  redirectTo: string
  children: ReactNode
}

export default function ProtectedRoute({
  allowed,
  redirectTo,
  children,
}: ProtectedRouteProps) {
  return allowed ? children : <Navigate to={redirectTo} replace />
}
