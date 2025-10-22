import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface PillProps {
  text: string;
  onRemove: () => void;
}

const Pill: React.FC<PillProps> = ({ text, onRemove }) => {
  return (
    <div className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-2">
      <span>{text}</span>
      <button onClick={onRemove} aria-label={`Remove ${text}`} className="text-white hover:text-slate-300 focus:outline-none">
        <CloseIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Pill;