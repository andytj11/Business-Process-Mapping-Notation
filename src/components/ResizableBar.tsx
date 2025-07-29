import React, { useState } from 'react';
// import './ResizableBar.css'; // Add custom styles for the resizable bar

const ResizableBar: React.FC = () => {
  const [width, setWidth] = useState(300); // Default width of the sidebar

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;

    const handleMouseMove = (event: MouseEvent) => {
      const newWidth = width + (event.clientX - startX);
      if (newWidth > 200 && newWidth < 600) {
        setWidth(newWidth); // Limit resizing between 200px and 600px
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: `${width}px`, background: '#f8f9fa', padding: '10px' }}>
        <h5>Resizable Sidebar</h5>
        <p>Content here...</p>
      </div>
      <div
        style={{
          width: '5px',
          cursor: 'col-resize',
          background: '#ddd',
        }}
        onMouseDown={handleMouseDown}
      ></div>
    </div>
  );
};

export default ResizableBar;
