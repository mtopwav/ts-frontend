import React from 'react';
import './LoadingSpinner.css';

function LoaderAnimation({ showDots = true }) {
  return (
    <>
      <div className="thiago-loader__spinner" aria-hidden="true">
        <div className="thiago-loader__ring" />
        <div className="thiago-loader__ring thiago-loader__ring--inner" />
      </div>
      {showDots && (
        <div className="thiago-loader__dots" aria-hidden="true">
          <span className="thiago-loader__dot" />
          <span className="thiago-loader__dot" />
          <span className="thiago-loader__dot" />
        </div>
      )}
    </>
  );
}

/** Full-page loader while a route or session initializes */
export function PageLoader({ message = 'Loading...', submessage }) {
  return (
    <div className="thiago-loader thiago-loader--page" role="status" aria-live="polite" aria-busy="true">
      <LoaderAnimation />
      <p className="thiago-loader__message">{message}</p>
      {submessage ? <p className="thiago-loader__submessage">{submessage}</p> : null}
    </div>
  );
}

/** Inline loader for tables, cards, and sections */
export function InlineLoader({ message = 'Loading...', size = 'md', showDots = false }) {
  return (
    <div
      className={`thiago-loader thiago-loader--inline thiago-loader--${size}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderAnimation showDots={showDots} />
      {message ? <span className="thiago-loader__message">{message}</span> : null}
    </div>
  );
}

/** Overlay while fetching data inside an existing page */
export function OverlayLoader({ message = 'Fetching data...', show = true }) {
  if (!show) return null;

  return (
    <div className="thiago-loader thiago-loader--overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="thiago-loader__panel">
        <LoaderAnimation />
        <p className="thiago-loader__message">{message}</p>
      </div>
    </div>
  );
}

/** Small spinner for buttons (login, submit, etc.) */
export function ButtonLoader({ message, size = 'sm' }) {
  return (
    <span className={`thiago-loader thiago-loader--inline thiago-loader--${size}`} style={{ display: 'inline-flex' }}>
      <LoaderAnimation showDots={false} />
      {message ? <span className="thiago-loader__message">{message}</span> : null}
    </span>
  );
}

export default PageLoader;
