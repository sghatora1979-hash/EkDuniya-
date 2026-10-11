'use client';
import MatrixRain from './MatrixRain';
import TouchFlourish from './TouchFlourish';

// Ambient layer behind every page: multilingual matrix rain + touch ripples.
export default function Ambient() {
  return (
    <>
      <MatrixRain />
      <TouchFlourish />
    </>
  );
}
