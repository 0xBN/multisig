import React from "react";

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, label }) => (
  <button className={`btn btn-secondary ${isActive ? "btn-active underline" : ""}`} onClick={onClick}>
    {label}
  </button>
);

export default TabButton;
