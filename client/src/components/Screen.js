import React from 'react';

const Screen = ({
  children,
  containerClassName = '',
  contentClassName = 'vertical fade-in',
}) => (
  <div className={`game-container ${containerClassName}`.trim()}>
    <div className={contentClassName}>{children}</div>
  </div>
);

export default Screen;
