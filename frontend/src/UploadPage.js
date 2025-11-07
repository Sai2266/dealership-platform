import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Button, Typography, Box, AppBar, Toolbar, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const UPLOAD_API = 'http://localhost:5000/api/documents/upload';
const ALLOWED_FILES = '.pdf,.jpg,.jpeg,.png';
const SUPPORTED_TYPES = 'PDF, JPG, JPEG, PNG';

const NavBar = ({ onLogout }) => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>Upload Documents</Typography>
      <Button color="inherit" onClick={onLogout}>Logout</Button>
    </Toolbar>
  </AppBar>
);

const FileUploadBox = ({ onFileSelect }) => (
  <Box sx={{ mb: 3, p: 3, border: '2px dashed #ccc', borderRadius: 1, textAlign: 'center' }}>
    <input type="file" multiple accept={ALLOWED_FILES} onChange={onFileSelect} id="file-input" style={{ display: 'none' }} />
    <label htmlFor="file-input">
      <Button component="span" variant="contained" startIcon={<CloudUploadIcon />} size="large">
        Choose Files
      </Button>
    </label>
    <Typography sx={{ mt: 2 }}>Supported: {SUPPORTED_TYPES}</Typography>
  </Box>
);

const FileList = ({ files }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6">Files ({files.length}):</Typography>
    {files.map((file, idx) => (
      <Typography key={idx} variant="body2">✅ {file.name}</Typography>
    ))}
  </Box>
);

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileSelect = (e) => setFiles(Array.from(e.target.files || []));

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Select files first');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Session expired - login again');
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          navigate('/auth');
        }, 1500);
        return;
      }

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const res = await fetch(UPLOAD_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Upload successful! Redirecting...');
        setFiles([]);
        setTimeout(() => navigate('/documents'), 1500);
      } else if (res.status === 401) {
        setError('Session expired - please login again');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/auth'), 1500);
      } else {
        setError(data.error || `Upload failed (${res.status})`);
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    } finally {
      setUploading(false);
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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>📤 Upload</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

          <FileUploadBox onFileSelect={handleFileSelect} />
          {files.length > 0 && <FileList files={files} />}

          <Button fullWidth variant="contained" size="large" onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Paper>
      </Container>
    </>
  );
}