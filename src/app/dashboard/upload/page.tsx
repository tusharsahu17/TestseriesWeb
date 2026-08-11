'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { postData } from '../../../services/apiClient';


export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setMessage('');
    } else {
      setUploadStatus('error');
      setMessage('Please select a valid Excel (.xlsx, .xls) or CSV file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setMessage('');

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Using fetch directly because axios with FormData sometimes requires specific header handling
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please check the file format and try again.');
      }

      const data = await response.json();
      
      setUploadStatus('success');
      setMessage(`Successfully uploaded ${data.count || 'the'} questions!`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <h1>Bulk Upload Questions ⇪</h1>
          <p>Easily import multiple questions using an Excel or CSV file.</p>
        </div>
      </div>

      <div className="dashboard-card" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '20px' }}>
        <div className="dashboard-card-header">
          <h3>Upload File</h3>
        </div>

        <div 
          style={{
            border: `2px dashed ${isDragging ? '#6c5ce7' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: isDragging ? '#f0eeff' : '#fafafa',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            style={{ display: 'none' }} 
          />
          
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#6c5ce7' }}>
            {file ? '📄' : '📁'}
          </div>
          
          {file ? (
            <div>
              <h3 style={{ marginBottom: '8px', color: '#2d3436' }}>{file.name}</h3>
              <p style={{ color: '#636e72', fontSize: '14px' }}>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: '8px', color: '#2d3436' }}>Drag & Drop your file here</h3>
              <p style={{ color: '#636e72', fontSize: '14px' }}>or click to browse from your computer</p>
              <p style={{ color: '#b2bec3', fontSize: '12px', marginTop: '12px' }}>Supported formats: .xlsx, .xls, .csv</p>
            </div>
          )}
        </div>

        {uploadStatus === 'error' && (
          <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
            <strong>Error:</strong> {message}
          </div>
        )}

        {uploadStatus === 'success' && (
          <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#e9faf3', color: '#059669', borderRadius: '8px', fontSize: '14px' }}>
            <strong>Success!</strong> {message}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="dashboard-continue-btn"
            style={{ backgroundColor: '#f1f2f6', color: '#2d3436', marginTop: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setUploadStatus('idle');
              setMessage('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            disabled={isUploading || !file}
          >
            Clear
          </button>
          
          <button 
            className="dashboard-continue-btn"
            style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={isUploading || !file}
          >
            {isUploading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Uploading...
              </>
            ) : (
              'Upload Questions'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #e9ebf0', paddingTop: '24px' }}>
          <h4 style={{ marginBottom: '12px', color: '#2d3436' }}>How to format your Excel file</h4>
          <ul style={{ color: '#636e72', fontSize: '13px', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>The first row must be the header row.</li>
            <li>Required columns: <strong>Question</strong>, <strong>Option A</strong>, <strong>Option B</strong>, <strong>Option C</strong>, <strong>Option D</strong>, <strong>Correct Answer</strong> (e.g., A, B, C, or D).</li>
            <li>Optional columns: <strong>Explanation</strong>, <strong>Marks</strong>, <strong>Subject</strong>, <strong>Topic</strong>.</li>
            <li>Ensure there are no blank rows between questions.</li>
          </ul>
          
          <div style={{ marginTop: '16px' }}>
            <a href="#" style={{ color: '#6c5ce7', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              ↓ Download Sample Template
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
