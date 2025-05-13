# EventSettings Component Refactoring

This folder contains the modularized components for the EventSettings page. The previous monolithic EventSettings.jsx file has been broken down into smaller, more manageable components.

## Current Status

- The main EventSettings.jsx file has been refactored to use a modular approach
- The mock data has been moved to a separate file: `mockData.js`
- The GeneralTab component has been created and implemented

## To Complete the Refactoring

### 1. Create the following tab components:

- **RegistrationTab.jsx**: For managing registration form fields and settings
  - Copy the registration settings section from the original file
  - Implement features for managing registration fields

- **ResourcesTab.jsx**: For configuring food, kit bag, and certificate settings
  - Copy the resources section from the original file
  - Implement features for managing meals, kit items, and certificates

- **AbstractsTab.jsx**: For abstract submission settings
  - Copy the abstracts section from the original file
  - Implement features for managing abstract topics and file types

- **BadgesTab.jsx**: For badge layout and field settings
  - Copy the badges section from the original file
  - Implement features for configuring badge dimensions and fields

- **PaymentTab.jsx**: For payment gateway settings
  - Implement the payment settings interface
  - Should include payment gateway selection and pricing by category

- **EmailTab.jsx**: For email template configuration
  - Implement the email settings interface
  - Should include template editing for various notification types

### 2. Integration

- Update the main EventSettings.jsx file to import and use all the new tab components
- Remove the PlaceholderTab component when all tabs are implemented

### 3. Testing

- Test each tab component individually
- Ensure data flows correctly between parent and child components
- Verify that the form state changes correctly trigger the Save button activation

## Component Structure

Each tab component should follow this structure:

```jsx
import React from 'react';

const TabComponent = ({ event, setEvent, setFormChanged, ...props }) => {
  // Tab-specific state and handlers
  
  // UI render
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Tab Title</h2>
      
      {/* Tab content */}
    </div>
  );
};

export default TabComponent;
```

## Benefits of this Approach

- Improved code organization and maintainability
- Easier to debug and test individual components
- Better performance as React only needs to re-render the active tab
- Enhanced developer experience with smaller, focused files 