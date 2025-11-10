// Ready for Supabase Auth integration

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // TODO: Implement with Supabase.auth.signInWithPassword
  throw new Error("Not implemented")
}

export async function signup(email: string, password: string, name: string): Promise<AuthUser> {
  // TODO: Implement with Supabase.auth.signUp
  throw new Error("Not implemented")
}

export async function logout(): Promise<void> {
  // TODO: Implement with Supabase.auth.signOut
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // TODO: Implement
  return null
}
