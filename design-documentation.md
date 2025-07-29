
  Process Mapping Tool Design System
  
  This file serves as documentation for the design system of the Process Mapping Tool.
  It helps both developers and AI tools understand the design choices and use them consistently.
  
  Color Palette:
  - Oxford Blue (#14213D): Primary background color for Navbar, headers
  - Gold (#FEC872): Primary accent color, highlight, hover, animation color
  - Gold Light (#FFE0A3): Secondary accent color
  - Black (#000000): Primary text color
  - Grey (#E5E5E5): Secondary text color
  - White (#FFFFFF): Secondary background color, background color for pages
  
  Design Principles:
  - Modern, responsive and sleek design
  - Animations for interactive elements
  - Hover states for better user feedback
  - Smooth user experience with appropriate transitions
  
  Usage:
  
  1. CSS Variables:
     Use var(--variable-name) in CSS files
     Example: background-color: var(--primary);
  
  2. Tailwind Classes:
     Use the tailwind classes that map to our variables
     Example: bg-primary text-text-on-primary
  
  3. Components:
     Buttons: Use .btn .btn-primary or .btn .btn-accent classes
     Cards: Use .card class
     Inputs: Use .input class
 