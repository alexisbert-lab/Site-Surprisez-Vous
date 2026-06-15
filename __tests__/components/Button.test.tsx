import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('affiche son libellé', () => {
    render(<Button>Commander</Button>);
    expect(screen.getByText('Commander')).toBeInTheDocument();
  });

  it('appelle onClick au clic', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cliquer</Button>);
    fireEvent.click(screen.getByText('Cliquer'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('est désactivé avec disabled', () => {
    render(<Button disabled>Désactivé</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('ne déclenche pas onClick si disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Désactivé</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applique la classe size sm', () => {
    render(<Button size="sm">Petit</Button>);
    expect(screen.getByRole('button').className).toMatch(/px-3/);
  });

  it('applique la classe variant outline', () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button').className).toMatch(/border-2/);
  });

  it('accepte une className personnalisée', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button').className).toMatch(/custom-class/);
  });
});
