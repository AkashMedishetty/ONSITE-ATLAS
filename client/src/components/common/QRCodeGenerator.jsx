import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

const QRCodeGenerator = ({ 
  registrationData, 
  size = 200, 
  includeDetails = true,
  downloadable = true,
  printable = true
}) => {
  const [isReady, setIsReady] = useState(false);
  const qrRef = useRef(null);
  
  // Process registration data to create QR code value
  const qrValue = JSON.stringify({
    id: registrationData.id || registrationData._id,
    regId: registrationData.registrationId || registrationData.regId,
    name: registrationData.name,
    category: registrationData.category?.name || registrationData.categoryName,
    eventId: registrationData.eventId,
    timestamp: new Date().toISOString()
  });
  
  // Set ready state after component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  // Function to download QR code
  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qrcode-${registrationData.registrationId || registrationData.regId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to print QR code
  const printQRCode = () => {
    if (!qrRef.current) return;
    
    const printWindow = window.open('', '_blank');
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas || !printWindow) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${registrationData.name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .qr-image {
              width: ${size}px;
              height: ${size}px;
              margin: 0 auto 16px;
            }
            .details {
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              font-size: 14px;
            }
            .reg-id {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0;
            }
            .name {
              font-size: 16px;
              margin: 8px 0;
            }
            .category {
              display: inline-block;
              padding: 4px 8px;
              background-color: #e2e8f0;
              border-radius: 12px;
              font-size: 12px;
              margin: 8px 0;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img class="qr-image" src="${dataUrl}" alt="QR Code" />
            <div class="details">
              <div class="reg-id">${registrationData.registrationId || registrationData.regId}</div>
              <div class="name">${registrationData.name}</div>
              <div class="category">${registrationData.category?.name || registrationData.categoryName}</div>
            </div>
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print();" style="padding: 8px 16px; background-color: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print
            </button>
            <button onclick="window.close();" style="padding: 8px 16px; margin-left: 8px; background-color: #e2e8f0; border: none; border-radius: 4px; cursor: pointer;">
              Close
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  return (
    <motion.div 
      className="qr-code-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      ref={qrRef}
    >
      <div className="flex justify-center">
        <QRCodeSVG 
          value={qrValue}
          size={size}
          level="H"
          includeMargin={true}
          className="rounded-lg"
        />
      </div>
      
      {includeDetails && (
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold">{registrationData.registrationId || registrationData.regId}</div>
          <div className="text-sm text-gray-600">{registrationData.name}</div>
          <div className="mt-1 inline-block px-2 py-1 bg-gray-100 rounded-full text-xs">
            {registrationData.category?.name || registrationData.categoryName}
          </div>
        </div>
      )}
      
      {(downloadable || printable) && (
        <div className="mt-4 flex justify-center space-x-3">
          {downloadable && (
            <button 
              onClick={downloadQRCode}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <i className="ri-download-line mr-2"></i>
              Download
            </button>
          )}
          
          {printable && (
            <button 
              onClick={printQRCode}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <i className="ri-printer-line mr-2"></i>
              Print
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default QRCodeGenerator; 