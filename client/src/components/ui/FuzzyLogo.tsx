import React from "react";

type FuzzyLogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

const FuzzyLogo: React.FC<FuzzyLogoProps> = ({ 
  width = 80, 
  height = 80,
  className = ""
}) => {
  return (
    <div 
      className={`fuzzy-logo relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to bottom right, #00ffcc, #00cccc)",
          borderRadius: "50%",
          filter: "blur(8px)",
          opacity: 0.9,
          transform: "scale(0.92)",
        }}
      />
      <div 
        className="absolute inset-0 flex items-center justify-center text-primary font-bold"
        style={{
          fontSize: `${Math.floor(width * 0.3)}px`,
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          fontFamily: "'Orbitron', sans-serif"
        }}
      >
        S
      </div>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: "50%",
          border: "2px solid rgba(0, 255, 204, 0.6)",
          boxShadow: "0 0 20px 3px rgba(0, 255, 204, 0.6)",
        }}
      />
    </div>
  );
};

export default FuzzyLogo;