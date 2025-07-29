'use client';
import { createContext, useContext } from 'react'

export interface User {
  id: string
  email: string
  role: string
}

const UserContext = createContext<User | null>(null)

export const useUser = () => useContext(UserContext)

export const UserProvider = ({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}