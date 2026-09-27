'use client';

import { useState } from 'react';

function TextExpander({ children, initialLines = 5 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 🔹 MODIFICATION: Check if children is an array (from DB) or a string (manual text)
  // If it's an array, we use it directly. If it's a string, we split it.
  const lines = Array.isArray(children)
    ? children
    : typeof children === 'string'
      ? children.split(/\r?\n/)
      : [];

  const displayText = isExpanded ? lines : lines.slice(0, initialLines);

  if (lines.length === 0) return null;

  return (
    <div className="transition-all duration-200">
      {displayText.map((line, index) => (
        <div key={index} className="flex items-start gap-2 mb-1">
          {/* 🔹 Added a bullet point for visual consistency with your 'Analysis' list */}
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 text-sm leading-relaxed">{line}</span>
        </div>
      ))}

      {lines.length > initialLines && (
        <button
          className="mt-2 text-blue-600 text-sm font-semibold underline hover:text-blue-800 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default TextExpander;
