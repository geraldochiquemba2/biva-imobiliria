// Simple auth utilities for demo
// TODO: Replace with proper bcrypt hashing in production

export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, just return the password
  // In production, use bcrypt.hash(password, 10)
  return password;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For demo purposes, just compare directly
  // In production, use bcrypt.compare(password, hash)
  return password === hash;
}
