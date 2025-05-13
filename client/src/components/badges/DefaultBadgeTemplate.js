/**
 * Default Badge Template
 * This file contains the default badge template with basic elements
 * that can be imported and used in the BadgeDesigner.
 */

const defaultBadgeTemplate = {
  name: 'Standard Badge Template',
  description: 'Default template with name, QR code, registration ID and category',
  isGlobal: true,
  orientation: 'portrait',
  size: { width: 3.375, height: 5.375 },
  unit: 'in',
  background: '#FFFFFF',
  backgroundImage: null,
  logo: null,
  elements: [
    // Full Name Text Element
    {
      id: 'name-123456',
      type: 'text',
      fieldType: 'name',
      content: '',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 40 },
      style: { 
        fontSize: 24, 
        fontFamily: 'Arial', 
        fontWeight: 'bold', 
        color: '#000000', 
        backgroundColor: 'transparent',
        textAlign: 'center',
        zIndex: 1
      }
    },
    
    // QR Code Element
    {
      id: 'qr-123456',
      type: 'qrCode',
      fieldType: 'qrCode',
      content: '',
      position: { x: 150, y: 150 },
      size: { width: 100, height: 100 },
      style: { 
        backgroundColor: 'transparent', 
        padding: 0,
        zIndex: 2
      }
    },
    
    // Registration ID Element
    {
      id: 'regid-123456',
      type: 'text',
      fieldType: 'registrationId',
      content: '',
      position: { x: 125, y: 260 },
      size: { width: 150, height: 30 },
      style: { 
        fontSize: 16, 
        fontFamily: 'Arial', 
        fontWeight: 'normal', 
        color: '#666666', 
        backgroundColor: 'transparent',
        textAlign: 'center',
        zIndex: 3
      }
    },
    
    // Category Element
    {
      id: 'category-123456',
      type: 'category',
      fieldType: 'category',
      content: '',
      position: { x: 140, y: 300 },
      size: { width: 120, height: 30 },
      style: { 
        fontSize: 14, 
        fontFamily: 'Arial', 
        fontWeight: 'normal', 
        color: '#FFFFFF', 
        backgroundColor: '#3B82F6', 
        padding: 5, 
        borderRadius: 16, 
        textAlign: 'center',
        zIndex: 4
      }
    }
  ],
  printSettings: {
    showBorder: true,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: 5,
    margin: 5
  }
};

export default defaultBadgeTemplate; 