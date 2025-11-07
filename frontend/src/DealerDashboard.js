import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Button, Typography, Box, AppBar, Toolbar } from '@mui/material';

const NavBar = ({ title, onLogout }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>{title}</Typography>
      <Button color="inherit" onClick={onLogout}>Logout</Button>
    </Toolbar>
  </AppBar>
);

export default function DealerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const actions = [
    { label: '📤 Upload Documents', path: '/upload' },
    { label: '📋 View Documents', path: '/documents' }
  ];

  return (
    <>
      <NavBar title="Dealership Platform" onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Welcome, {user.dealership_name}! 👋</Typography>
          <Typography color="textSecondary" sx={{ mb: 4 }}>Email: {user.email}</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {actions.map((action, idx) => (
              <Button key={idx} variant="contained" size="large" onClick={() => navigate(action.path)}>
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>
      </Container>
    </>
  );
}