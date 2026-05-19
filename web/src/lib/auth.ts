export type UserRole = 'TRAINER' | 'CLIENT';

export function saveAuth(
  accessToken: string,
  mustChangePassword: boolean,
  role: UserRole
) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem(
    'mustChangePassword',
    String(mustChangePassword)
  );
  localStorage.setItem('role', role);
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('mustChangePassword');
  localStorage.removeItem('role');
}

export function getToken() {
  return localStorage.getItem('accessToken');
}

export function getRole(): UserRole | null {
  const role = localStorage.getItem('role');

  if (role === 'TRAINER' || role === 'CLIENT') {
    return role;
  }

  return null;
}

export function mustChangePassword() {
  return (
    localStorage.getItem('mustChangePassword') === 'true'
  );
}

export function isAuthenticated() {
  return !!getToken();
}