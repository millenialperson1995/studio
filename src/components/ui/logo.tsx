import { cn } from "@/lib/utils";
import React from "react";

// The SVG content is directly embedded here.
// The `className` prop is passed to the <svg> element to allow for custom styling.
export const Logo = ({ className }: { className?: string }) => (
  <svg
    width="512"
    height="512"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("text-primary", className)} // Default color can be set here
  >
    <g clipPath="url(#clip0_405_2)">
      <path
        d="M426.88 200.64L311.36 85.12L354.56 42.24L469.76 157.44L426.88 200.64ZM268.8 128L153.6 243.2L268.8 358.4L384 243.2L268.8 128ZM110.72 200.64L153.6 157.76L42.24 42.24L-1.97323e-05 85.12L110.72 200.64ZM0 427.52H512V469.76H0V427.52ZM153.6 311.36L42.24 426.88L85.12 469.76L200.64 354.56L153.6 311.36ZM354.56 354.56L469.76 469.76L426.88 426.88L311.36 311.36L354.56 354.56Z"
        fill="currentColor" // Use currentColor to inherit color from parent's text color
      />
    </g>
    <defs>
      <clipPath id="clip0_405_2">
        <rect width="512" height="512" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
