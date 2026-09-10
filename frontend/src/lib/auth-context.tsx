import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/lib/api"
import type { LoginResponse, Person } from "@/types"

interface AuthContextType {
  user: Person | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Person | null>(() => {
    const savedUser = localStorage.getItem("auth_user")
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token")
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Configure axios authorization header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common["Authorization"]
    }
  }, [token])

  // Verify token on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const response = await api.get<Person>("/auth/me")
        setUser(response.data)
        localStorage.setItem("auth_user", JSON.stringify(response.data))
      } catch {
        // Token expired or invalid
        logout()
      } finally {
        setIsLoading(false)
      }
    }
    verifyAuth()
  }, [token])

  const login = async (email: string, password: string) => {
    const response = await api.post<LoginResponse>("/auth/login", { email, password })
    const { access_token, user: loggedUser } = response.data

    setToken(access_token)
    setUser(loggedUser)

    localStorage.setItem("auth_token", access_token)
    localStorage.setItem("auth_user", JSON.stringify(loggedUser))
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    delete api.defaults.headers.common["Authorization"]
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
