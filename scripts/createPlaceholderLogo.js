const fs = require('fs');
const path = require('path');

// Create a simple SVG logo
const svgLogo = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="60" height="60" fill="#4285F4"/>
  <text x="30" y="30" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-weight="bold" font-size="24">R</text>
</svg>`;

// Define the directory and file path
const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logo.png');

// Make sure the directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the SVG to a file
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgLogo);
console.log('Created placeholder SVG logo');

// Log instructions
console.log(`
Placeholder logo created at:
- ${path.join(publicDir, 'logo.svg')}

For a PNG logo, you'll need to:
1. Manually convert the SVG to PNG, or
2. Place your own logo.png file in the public directory (${publicDir})

The application is configured to use /logo.png
`);
