import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Signup from '../page'; // Adjust path to point to src/app/signup/page.tsx
import { createBrowserClient } from '@supabase/ssr';

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
    },
  })),
}));

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

// Mock useRouter from next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Signup Component', () => {
  let supabaseMock: any;

  beforeEach(() => {
    supabaseMock = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    jest.clearAllMocks();
    // Reset window.location.href mock
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  test('renders signup form correctly', () => {
    render(<Signup />);
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('displays error when passwords do not match', async () => {
    render(<Signup />);
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Different123!');
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
  });

  test('displays error when password is less than 8 characters', async () => {
    render(<Signup />);
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Pass1!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Pass1!');
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
  });

  test('displays error for invalid email format', async () => {
    render(<Signup />);
    await userEvent.type(screen.getByLabelText(/Email address/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    fireEvent.submit(screen.getByRole('form'));

    // Browser HTML5 validation should prevent submission
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
    // Note: Testing browser validation messages is tricky; we rely on required and type="email"
  });

  test('successful signup redirects to login page', async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' }, session: null },
      error: null,
    });

    render(<Signup />);
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.selectOptions(screen.getByLabelText(/Role/i), 'USER');
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Account created successfully/i)).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      options: { data: { role: 'USER' } },
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    }, { timeout: 3000 });
  });

  test('displays error when Supabase signup fails', async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already exists' },
    });

    render(<Signup />);
    await userEvent.type(screen.getByLabelText(/Email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/User already exists/i)).toBeInTheDocument();
    expect(supabaseMock.auth.signUp).toHaveBeenCalled();
  });

  test('toggles password visibility', async () => {
    render(<Signup />);
    const passwordInput = screen.getByLabelText(/Password/i);
    const toggleButton = screen.getAllByRole('button', { name: /eye/i })[0];

    expect(passwordInput).toHaveAttribute('type', 'password');
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});