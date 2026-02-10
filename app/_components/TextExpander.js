"use client";

import { useState } from 'react';

function TextExpander({ children, initialLines = 5 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Split by newlines (\r\n or \n)
  const lines = children.split(/\r?\n/);

  const displayText = isExpanded
    ? lines
    : lines.slice(0, initialLines);

  return (
    <div>
      {displayText.map((line, index) => (
        <div key={index}>{line}</div>
      ))}

      {lines.length > initialLines && (
        <button
          className="text-primary-700 border-b border-primary-700 leading-3 pb-1 mt-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default TextExpander;
