import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Button, Typography, Box, AppBar, Toolbar, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';

const API_URL = 'http://localhost:5000/api/documents';

const NavBar = ({ onLogout }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>My Documents</Typography>
      <Button color="inherit" onClick={onLogout}>Logout</Button>
    </Toolbar>
  </AppBar>
);

const DocumentTable = ({ documents, onDownload, onDelete }) => (
  <Paper sx={{ overflowX: 'auto' }}>
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell>Filename</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>{doc.filename}</TableCell>
            <TableCell>{doc.file_type}</TableCell>
            <TableCell>{doc.status}</TableCell>
            <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button size="small" onClick={() => onDownload(doc.id, doc.original_filename)}>Download</Button>
              <Button size="small" color="error" onClick={() => onDelete(doc.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Session expired - login again');
        setTimeout(() => navigate('/auth'), 1500);
        return;
      }

      const res = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setError('');
      } else if (res.status === 401) {
        setError('Session expired - login again');
        setTimeout(() => {
          localStorage.clear();
          navigate('/auth');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load documents');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Download failed');
      }
    } catch (err) {
      setError('Download error');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setError('');
        loadDocuments();
      } else {
        setError('Delete failed');
      }
    } catch (err) {
      setError('Delete error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <>
      <NavBar onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" onClick={() => navigate('/upload')}>📤 Upload More</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : documents.length === 0 ? (
          <Typography>No documents uploaded yet</Typography>
        ) : (
          <DocumentTable documents={documents} onDownload={handleDownload} onDelete={handleDelete} />
        )}
      </Container>
    </>
  );
}