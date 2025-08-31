import React from 'react';

const LoadingSpinner = () => {
  const loaderStyles = {
    width: '60px',
    aspectRatio: '2',
    '--_g': 'no-repeat radial-gradient(circle closest-side, #005AFF 90%, transparent)',
    background: 'var(--_g) 0% 50%, var(--_g) 50% 50%, var(--_g) 100% 50%',
    backgroundSize: 'calc(100%/3) 50%',
    animation: 'l3 1s infinite linear'
  };

  return (
    <>
      <style>
        {`
          @keyframes l3 {
            20% { background-position: 0% 0%, 50% 50%, 100% 50%; }
            40% { background-position: 0% 100%, 50% 0%, 100% 50%; }
            60% { background-position: 0% 50%, 50% 100%, 100% 0%; }
            80% { background-position: 0% 50%, 50% 50%, 100% 100%; }
          }
        `}
      </style>
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-40">
        <div style={loaderStyles}></div>
      </div>
    </>
  );
};

export default LoadingSpinner;
