import * as React from "react";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className || ""}`}
      {...props}
    />
  );
}

export { Skeleton };
