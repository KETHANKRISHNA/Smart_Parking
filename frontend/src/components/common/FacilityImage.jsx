import React, { useState } from 'react';
import { categoryOf } from '../../utils/categories';

/**
 * A facility photo that degrades gracefully. External photos can be missing or blocked, so when the image is
 * absent or fails to load we show a tinted panel with the category icon instead of an empty box.
 */
export const FacilityImage = ({ src, category, alt = '', className = '', iconClass = 'w-10 h-10', children }) => {
  const [failed, setFailed] = useState(false);
  const { icon: Icon, tone } = categoryOf(category);
  const showPhoto = src && !failed;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tone} ${className}`}>
      {showPhoto ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Icon className={`${iconClass} opacity-60`} strokeWidth={1.5} />
        </div>
      )}
      {children}
    </div>
  );
};
