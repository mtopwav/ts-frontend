import React from 'react';

function SidebarBackdrop({ onClose }) {
  return (
    <button
      type="button"
      className="sidebar-backdrop"
      onClick={onClose}
      aria-label="Close menu"
    />
  );
}

export default SidebarBackdrop;
