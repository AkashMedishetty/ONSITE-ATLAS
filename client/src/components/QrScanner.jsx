import React, { useEffect, useRef, forwardRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const QrScanner = forwardRef((props, ref) => {
  const { 
    onScanComplete,
    width = '100%',
    height = '300px',
    fps = 10,
    qrbox = { width: 250, height: 250 },
    aspectRatio = 1.0
  } = props;
  
  const html5QrCodeRef = useRef(null);
  const containerRef = useRef(null);
  const cameraId = useRef(null);
  const isScanning = useRef(false);
  
  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    startScanner: startScanner,
    stopScanner: stopScanner,
    switchCamera: switchCamera
  }));
  
  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanning.current) {
        html5QrCodeRef.current.stop().catch(err => {
          console.error("Error stopping scanner:", err);
        });
      }
    };
  }, []);
  
  // Auto-start scanner with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const startScanner = async () => {
    if (!containerRef.current || isScanning.current) return;
    
    try {
      // Initialize scanner if not already done
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerRef.current.id);
      }
      
      // Get cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        // Choose rear camera if available
        cameraId.current = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )?.id || devices[0].id;
        
        // Start the scanner
        await html5QrCodeRef.current.start(
          { deviceId: cameraId.current },
          {
            fps,
            qrbox,
            aspectRatio
          },
          (decodedText) => {
            if (onScanComplete) {
              onScanComplete(decodedText);
              stopScanner();
            }
          },
          (error) => {
            console.debug("QR scanning in progress:", error);
          }
        );
        
        isScanning.current = true;
      } else {
        console.error("No cameras found");
      }
    } catch (error) {
      console.error("Error starting scanner:", error);
    }
  };
  
  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanning.current = false;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };
  
  const switchCamera = async () => {
    if (!html5QrCodeRef.current) return;
    
    try {
      await stopScanner();
      
      const devices = await Html5Qrcode.getCameras();
      
      if (devices.length > 1) {
        const currentIndex = devices.findIndex(d => d.id === cameraId.current);
        const nextIndex = (currentIndex + 1) % devices.length;
        cameraId.current = devices[nextIndex].id;
        
        await startScanner();
      }
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };
  
  return (
    <div style={{ width, height, position: 'relative' }}>
      <div
        id="qr-reader"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      ></div>
    </div>
  );
});

QrScanner.displayName = 'QrScanner';

// Also provide a default export for backward compatibility
export default QrScanner; 