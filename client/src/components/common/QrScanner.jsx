import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QrScanner({ onScanComplete, width = '100%', height = '300px' }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  
  useEffect(() => {
    // Initialize scanner when component mounts
    if (containerRef.current) {
      const scannerId = 'qr-scanner-' + Math.random().toString(36).substring(2, 10);
      containerRef.current.id = scannerId;
      
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;
      
      // Start scanner with delay to ensure DOM is ready
      setTimeout(() => {
        startScanner(html5QrCode);
      }, 500);
    }
    
    // Clean up on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error('Error stopping scanner:', error);
        });
      }
    };
  }, []);
  
  const startScanner = async (scanner) => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras && cameras.length > 0) {
        // Choose the rear camera if available
        const cameraId = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear')
        )?.id || cameras[0].id;
        
        await scanner.start(
          { deviceId: cameraId },
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            if (onScanComplete) {
              onScanComplete(decodedText);
              
              // Stop scanner after successful scan
              scanner.stop().catch(error => {
                console.error('Error stopping scanner after scan:', error);
              });
            }
          },
          (errorMessage) => {
            // Just log errors in scanning process, don't show to user
            console.debug('QR code scanning error:', errorMessage);
          }
        );
      } else {
        console.error('No cameras found');
      }
    } catch (error) {
      console.error('Error starting QR scanner:', error);
    }
  };
  
  return (
    <div style={{ width, height, overflow: 'hidden', position: 'relative' }}>
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// Also export as default for compatibility
export default QrScanner; 