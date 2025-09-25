import React from 'react';

interface Code39BarcodeProps {
  value: string;
  height?: number;
  barWidth?: number;
  quietZone?: number;
  showText?: boolean;
}

// Code 39 (Code 3 of 9) encoding for characters 0-9, A-Z and - . space $ / + %
// Each character is 9 elements (bars/spaces), 3 of which are wide
const CODE39_MAP: Record<string, string> = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
  'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
  'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
  'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
  'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
  'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
  'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
  '-': '100101011011', '.': '110010101101', ' ': '100110101101', '$': '100100100101',
  '/': '100100101001', '+': '100101001001', '%': '101001001001', '*': '100101101101' // start/stop
};

function sanitize(input: string): string {
  return input.toUpperCase().split('').filter(ch => CODE39_MAP[ch] && ch !== '*').join('');
}

const Code39Barcode: React.FC<Code39BarcodeProps> = ({ value, height = 60, barWidth = 2, quietZone = 10, showText = true }) => {
  const data = `*${sanitize(value)}*`;

  // Build bars
  let x = quietZone;
  const bars: React.ReactNode[] = [];
  for (let i = 0; i < data.length; i++) {
    const pattern = CODE39_MAP[data[i]];
    // Each pattern is 12 elements where 1=bar, 0=space; wide vs narrow is encoded by consecutive 1s
    for (let j = 0; j < pattern.length; j++) {
      const isBar = pattern[j] === '1';
      const width = barWidth;
      if (isBar) {
        bars.push(
          <rect key={`${i}-${j}-${x}`} x={x} y={0} width={width} height={height} fill="#111827" />
        );
      }
      x += width; // move for next element
    }
    // Narrow space between characters
    x += barWidth;
  }

  const totalWidth = x + quietZone;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`} role="img" aria-label={`Code 39 barcode for ${value}`}>
        <rect x={0} y={0} width={totalWidth} height={height} fill="#ffffff" />
        {bars}
      </svg>
      {showText && (
        <div className="mt-2 text-sm font-mono text-gray-700">{value}</div>
      )}
    </div>
  );
};

export default Code39Barcode;


