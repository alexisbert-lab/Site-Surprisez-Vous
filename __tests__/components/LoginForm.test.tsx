import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/LoginForm';

// Mock useAuth
const loginWithEmail = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ loginWithEmail }),
}));

// Mock useFadeIn (anime.js — inutile dans jsdom)
vi.mock('@/lib/useAnime', () => ({
  useFadeIn: () => ({ current: null }),
}));

beforeEach(() => {
  loginWithEmail.mockReset();
});

describe('LoginForm — rendu', () => {
  it('affiche les champs identifiant et mot de passe', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/identifiant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('affiche le bouton Se connecter', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('affiche title et subtitle personnalisés', () => {
    render(<LoginForm title="Espace Admin" subtitle="Accès réservé" />);
    expect(screen.getByText('Espace Admin')).toBeInTheDocument();
    expect(screen.getByText('Accès réservé')).toBeInTheDocument();
  });
});

describe('LoginForm — connexion email admin', () => {
  it('appelle loginWithEmail avec l\'email tel quel', async () => {
    loginWithEmail.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'admin@surprisez-vous.fr');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'motdepasse');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('admin@surprisez-vous.fr', 'motdepasse');
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('LoginForm — connexion identifiant pro (sans @)', () => {
  it('construit le faux email sv.local', async () => {
    loginWithEmail.mockResolvedValue(undefined);
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'client123');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('client123@sv.local', 'sv-secret');
    });
  });
});

describe('LoginForm — gestion d\'erreurs', () => {
  it('affiche "Identifiant ou mot de passe incorrect" sur auth/wrong-password', async () => {
    loginWithEmail.mockRejectedValue({ code: 'auth/wrong-password' });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'bad@user.fr');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/identifiant ou mot de passe incorrect/i)).toBeInTheDocument();
    });
  });

  it('affiche message "trop de tentatives" sur auth/too-many-requests', async () => {
    loginWithEmail.mockRejectedValue({ code: 'auth/too-many-requests' });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'user@test.fr');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'pass');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/trop de tentatives/i)).toBeInTheDocument();
    });
  });

  it('affiche erreur réseau sur auth/network-request-failed', async () => {
    loginWithEmail.mockRejectedValue({ code: 'auth/network-request-failed' });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'user@test.fr');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'pass');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument();
    });
  });

  it('désactive le bouton pendant le chargement', async () => {
    // La promesse ne se résout jamais → simule le loading
    loginWithEmail.mockReturnValue(new Promise(() => {}));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/identifiant/i), 'user@test.fr');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'pass');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion/i })).toBeDisabled();
    });
  });
});
