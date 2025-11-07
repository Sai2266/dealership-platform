import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Select, MenuItem, Tabs, Tab } from '@mui/material';

const LOGIN_API = 'http://localhost:5000/api/auth/login';
const REGISTER_API = 'http://localhost:5000/api/auth/register';

export default function AuthPage({ setIsLoggedIn }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealership_name, setDealershipName] = useState('');
  const [role, setRole] = useState('dealer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDealershipName('');
    setRole('dealer');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(LOGIN_API, {
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
      const res = await fetch(REGISTER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, dealership_name, role })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Account created! Now login.');
        resetForm();
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

  const loginFields = [
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Password', type: 'password' }
  ];

  const registerFields = [
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Password', type: 'password' },
    { name: 'dealership_name', label: 'Dealership Name', type: 'text' }
  ];

  const fieldValues = { email, password, dealership_name };

  const handleFieldChange = (name, value) => {
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'dealership_name') setDealershipName(value);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} sx={{ mb: 3 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {tab === 0 ? (
          <Box component="form" onSubmit={handleLogin}>
            <Typography variant="h5" sx={{ mb: 2 }}>Login</Typography>
            {loginFields.map(field => (
              <TextField key={field.name} fullWidth label={field.label} type={field.type} value={fieldValues[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)} sx={{ mb: 2 }} required />
            ))}
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mb: 2 }}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegister}>
            <Typography variant="h5" sx={{ mb: 2 }}>Register</Typography>
            {registerFields.map(field => (
              <TextField key={field.name} fullWidth label={field.label} type={field.type} value={fieldValues[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)} sx={{ mb: 2 }} required />
            ))}
            <Select fullWidth value={role} onChange={(e) => setRole(e.target.value)} sx={{ mb: 2 }}>
              <MenuItem value="dealer">Dealer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mb: 2 }}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}