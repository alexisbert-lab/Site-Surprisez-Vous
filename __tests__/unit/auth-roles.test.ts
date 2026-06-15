import { describe, it, expect } from 'vitest';
import type { UserRole } from '@/lib/auth-context';

// Logique de résolution du rôle extraite pour être testable isolément
const ADMIN_EMAILS = [
  'alexis.bert@surprisez-vous.fr',
  'laurent.moulle@surprisez-vous.fr',
];

function resolveRole(email: string | null): UserRole {
  if (!email) return 'public';
  return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'public';
}

function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin';
}

function canAccessPro(role: UserRole): boolean {
  return role === 'pro' || role === 'admin';
}

describe('resolveRole', () => {
  it('admin pour les emails autorisés', () => {
    expect(resolveRole('alexis.bert@surprisez-vous.fr')).toBe('admin');
    expect(resolveRole('laurent.moulle@surprisez-vous.fr')).toBe('admin');
  });

  it('insensible à la casse', () => {
    expect(resolveRole('ALEXIS.BERT@SURPRISEZ-VOUS.FR')).toBe('admin');
  });

  it('public pour email inconnu', () => {
    expect(resolveRole('random@gmail.com')).toBe('public');
  });

  it('public si email null', () => {
    expect(resolveRole(null)).toBe('public');
  });
});

describe('canAccessAdmin', () => {
  it('autorise uniquement admin', () => {
    expect(canAccessAdmin('admin')).toBe(true);
    expect(canAccessAdmin('pro')).toBe(false);
    expect(canAccessAdmin('public')).toBe(false);
  });
});

describe('canAccessPro', () => {
  it('autorise pro et admin', () => {
    expect(canAccessPro('pro')).toBe(true);
    expect(canAccessPro('admin')).toBe(true);
    expect(canAccessPro('public')).toBe(false);
  });
});
