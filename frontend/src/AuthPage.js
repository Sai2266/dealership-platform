import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Select, MenuItem, Tabs, Tab } from '@mui/material';

const API_URL = 'http://localhost:5000/api/auth';

const LoginForm = ({ email, setEmail, password, setPassword, loading, onSubmit }) => (
  <Box component="form" onSubmit={onSubmit}>
    <Typography variant="h5" sx={{ mb: 2 }}>Login</Typography>
    <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} required />
    <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} required />
    <Button fullWidth variant="contained" type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </Button>
  </Box>
);

const RegisterForm = ({ email, setEmail, password, setPassword, dealership_name, setDealershipName, role, setRole, loading, onSubmit }) => (
  <Box component="form" onSubmit={onSubmit}>
    <Typography variant="h5" sx={{ mb: 2 }}>Register</Typography>
    <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} required />
    <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} required />
    <TextField fullWidth label="Dealership Name" value={dealership_name} onChange={(e) => setDealershipName(e.target.value)} sx={{ mb: 2 }} required />
    <Select fullWidth value={role} onChange={(e) => setRole(e.target.value)} sx={{ mb: 2 }}>
      <MenuItem value="dealer">Dealer</MenuItem>
      <MenuItem value="admin">Admin</MenuItem>
    </Select>
    <Button fullWidth variant="contained" type="submit" disabled={loading}>
      {loading ? 'Registering...' : 'Register'}
    </Button>
  </Box>
);

export default function AuthPage({ setIsLoggedIn }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealership_name, setDealershipName] = useState('');
  const [role, setRole] = useState('dealer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, dealership_name, role })
      });

      const data = await res.json();

      if (res.ok) {
        setEmail('');
        setPassword('');
        setDealershipName('');
        setError('Account created! Please login.');
        setTab(0);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: 'url(/Rolls.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 0
      }
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && <Alert severity={tab === 0 ? 'error' : 'success'} sx={{ mb: 2 }}>{error}</Alert>}

          {tab === 0 && <LoginForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} loading={loading} onSubmit={handleLogin} />}

          {tab === 1 && <RegisterForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} dealership_name={dealership_name} setDealershipName={setDealershipName} role={role} setRole={setRole} loading={loading} onSubmit={handleRegister} />}
        </Paper>
      </Container>
    </Box>
  );
}