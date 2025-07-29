'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { createBrowserClient } from '@supabase/ssr';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning' | '';
    message: string;
  }>({ type: '', message: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const searchParams = useSearchParams();
  // Get the redirect path from URL params or default to dashboard
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  // Create a Supabase client specifically for this component
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: 'info', message: 'Logging in...' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMsg = error.message || 'Invalid email or password';
        if (
          errorMsg.toLowerCase().includes('email not confirmed') ||
          errorMsg.toLowerCase().includes('email confirmation required') ||
          errorMsg.toLowerCase().includes('user has not confirmed')
        ) {
          errorMsg = 'You need to confirm your email before logging in. Please check your inbox for a confirmation email.';
        }
        setStatusMessage({
          type: 'error',
          message: errorMsg
        });
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setStatusMessage({
          type: 'success',
          message: 'Login successful! Redirecting to dashboard...'
        });
        
        // Do a hard navigation to ensure the session is picked up
        window.location.href = redirectTo;
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <Container fluid className="py-5 min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center my-4">
        <Col xs={12} md={8} lg={6} xl={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg border-0 rounded-lg overflow-hidden">
              <Card.Header className="text-center bg-primary text-white p-4">
                <div className="d-flex justify-content-center mb-2">
                  <Image
                    src="/rose-logo.png"
                    alt="ROSE Logo"
                    width={60}
                    height={60}
                    className="rounded-circle bg-blue-900 p-2"
                    priority
                  />
                </div>
                <h2 className="font-weight-bold mb-0">Welcome Back</h2>
                <p className="text-white-50 mb-0">Log in to your account</p>
              </Card.Header>
              
              <Card.Body className="p-4 p-lg-5">
                {statusMessage.type && (
                  <Alert variant={statusMessage.type} className="mb-4">
                    {statusMessage.message}
                  </Alert>
                )}
                
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Email address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="py-2"
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="d-flex justify-content-between">
                      <span className="fw-bold">Password</span>
                      <Link 
                        href="/forgot-password"
                        className="text-decoration-none text-primary"
                      >
                        Forgot password?
                      </Link>
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock"></i>
                      </span>
                      <Form.Control
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="py-2"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={togglePasswordVisibility}
                        type="button"
                      >
                        <i className={`bi ${passwordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </Button>
                    </div>
                  </Form.Group>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="w-100 py-2 mt-4 mb-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : 'Log In'}
                    </Button>
                  </motion.div>
                </Form>
              </Card.Body>
              
              <Card.Footer className="bg-white text-center py-4 border-0">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <motion.span whileHover={{ scale: 1.05 }}>
                    <Link href="/signup" className="text-primary fw-bold text-decoration-none">
                      Sign Up
                    </Link>
                  </motion.span>
                </p>
              </Card.Footer>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
}
