import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import OriginalImg from '@theme-original/MDXComponents/Img';

function ImageViewer({src, alt, onClose}) {
  const dialog = useRef(null);
  const [fullSize, setFullSize] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      className="image-viewer"
      aria-label={alt ? `Expanded image: ${alt}` : 'Expanded image'}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current.close();
      }}>
      <div className="image-viewer__toolbar">
        <button type="button" onClick={() => setFullSize(!fullSize)}>
          {fullSize ? 'Fit to screen' : 'Actual size'}
        </button>
        <button type="button" autoFocus onClick={() => dialog.current.close()}>
          Close
        </button>
      </div>
      <div className={`image-viewer__content${fullSize ? ' image-viewer__content--full' : ''}`}>
        <img src={src} alt={alt || ''} />
      </div>
    </dialog>,
    document.body,
  );
}

export default function ExpandableImage(props) {
  const [expandedSource, setExpandedSource] = useState(null);

  function expand(event) {
    // Preserve navigation for images that are already links.
    if (event.currentTarget.closest('a')) return;
    event.preventDefault();
    event.currentTarget.focus();
    setExpandedSource(event.currentTarget.currentSrc || props.src);
  }

  return (
    <>
      <OriginalImg
        {...props}
        className={`${props.className || ''} expandable-image`}
        role="button"
        tabIndex={0}
        aria-label={props.alt ? `Expand image: ${props.alt}` : 'Expand image'}
        aria-haspopup="dialog"
        onClick={expand}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') expand(event);
        }}
      />
      {expandedSource && (
        <ImageViewer src={expandedSource} alt={props.alt} onClose={() => setExpandedSource(null)} />
      )}
    </>
  );
}
