import { useState, useEffect, useCallback } from 'react';

export type ElementAnnotations = Record<string, string>;

export function usePersistentAnnotations() {
  const [annotations, setAnnotations] = useState<ElementAnnotations>(() => {
    try {
      const saved = localStorage.getItem('archiview_element_annotations');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse element annotations from localStorage:', e);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('archiview_element_annotations', JSON.stringify(annotations));
    } catch (e) {
      console.error('Failed to persist element annotations to localStorage:', e);
    }
  }, [annotations]);

  const updateAnnotation = useCallback((elementId: string, text: string) => {
    setAnnotations((prev) => {
      const trimmed = text.trim();
      if (!trimmed) {
        const copy = { ...prev };
        delete copy[elementId];
        return copy;
      }
      return {
        ...prev,
        [elementId]: trimmed,
      };
    });
  }, []);

  const clearAnnotation = useCallback((elementId: string) => {
    setAnnotations((prev) => {
      const copy = { ...prev };
      delete copy[elementId];
      return copy;
    });
  }, []);

  const clearAllAnnotations = useCallback(() => {
    setAnnotations({});
  }, []);

  return {
    annotations,
    updateAnnotation,
    clearAnnotation,
    clearAllAnnotations,
  };
}
