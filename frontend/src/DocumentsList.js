import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Button, Typography, Box, AppBar, Toolbar, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

const API_URL = 'http://localhost:5000/api/documents';

const DataRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
    <Typography sx={{ fontWeight: 'bold', color: '#666' }}>{label}:</Typography>
    <Typography>{value || 'N/A'}</Typography>
  </Box>
);

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(API_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });

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
      const res = await fetch(`${API_URL}/${doc.id}/notes`, { headers: { 'Authorization': `Bearer ${token}` } });

      if (res.ok) {
        const data = await res.json();
        setSelectedDoc(doc);
        setOcrData(data);
        setNotes(data.notes || '');
      } else {
        setError('Error loading document');
      }
    } catch (err) {
      setError('Error loading document');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${selectedDoc.id}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (res.ok) {
        setError('Notes saved!');
        setSelectedDoc(null);
        loadDocuments();
      } else {
        setError('Error saving notes');
      }
    } catch (err) {
      setError('Error saving notes');
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${docId}/download`, { headers: { 'Authorization': `Bearer ${token}` } });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Download error');
      }
    } catch (err) {
      setError('Download error');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/${docId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });

      if (res.ok) {
        setError('Deleted');
        loadDocuments();
      } else {
        setError('Delete error');
      }
    } catch (err) {
      setError('Delete error');
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

      <Dialog open={!!selectedDoc} onClose={() => setSelectedDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDoc?.filename}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Extracted Data</Typography>
            <DataRow label="VIN" value={ocrData?.vin} />
            <DataRow label="Buyer Name" value={ocrData?.buyer_name} />
            <DataRow label="Seller Name" value={ocrData?.seller_name} />
            <DataRow label="Sale Date" value={ocrData?.sale_date} />
            <DataRow label="Sale Amount" value={ocrData?.sale_amount} />
            <DataRow label="Odometer Reading" value={ocrData?.odometer_reading} />
            <DataRow label="Document Type" value={ocrData?.document_type} />
            <DataRow label="Status" value={ocrData?.status} />
          </Box>

          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Notes</Typography>
          <TextField fullWidth multiline rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes or annotations..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)}>Close</Button>
          <Button variant="contained" onClick={handleSaveNotes}>Save Notes</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}