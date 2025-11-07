import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Button, Typography, Box, AppBar, Toolbar,
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';

const API_URL = 'http://localhost:5000/api/documents';

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (doc) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${doc.id}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedDoc(doc);
        setNotes(data.notes);
      }
    } catch (err) {
      alert('Error loading document');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${selectedDoc.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (res.ok) {
        alert('Notes saved!');
        setSelectedDoc(null);
        loadDocuments();
      }
    } catch (err) {
      alert('Error saving notes');
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
      }
    } catch (err) {
      alert('Download error');
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
        alert('Deleted');
        loadDocuments();
      }
    } catch (err) {
      alert('Delete error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>My Documents</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" onClick={() => navigate('/upload')}>📤 Upload More</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <CircularProgress />}

        {!loading && documents.length === 0 && <Typography>No documents yet</Typography>}

        {!loading && documents.length > 0 && (
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
                      <Button size="small" color="primary" onClick={() => handleView(doc)}>View</Button>
                      <Button size="small" onClick={() => handleDownload(doc.id, doc.original_filename)}>Download</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(doc.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>

      {/* View/Edit Dialog */}
      <Dialog open={!!selectedDoc} onClose={() => setSelectedDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDoc?.filename}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or annotations..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)}>Close</Button>
          <Button variant="contained" onClick={handleSaveNotes}>Save Notes</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}