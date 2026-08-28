import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Desplegable propio (#297): el <select> nativo abre un menú del sistema
// operativo — blanco, tipografía ajena y, sobre el fondo oscuro del sitio,
// prácticamente ilegible en escritorio. Este listbox usa los mismos tokens que
// el resto del formulario y se maneja con teclado igual que el nativo.
export default function SelectField({ id, value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = `${useId()}-listbox`;

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex] || options[0];

  useEffect(() => {
    if (!open) return undefined;
    setActiveIndex(selectedIndex);
    const onDocPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children?.[activeIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const commit = (index) => {
    const opt = options[index];
    if (opt) onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(activeIndex);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={`select-field ${open ? 'is-open' : ''}`} ref={wrapRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className="select-control"
        // El foco NUNCA sale del botón: por eso es él quien lleva el rol de
        // combobox y el aria-activedescendant de la opción resaltada.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span className="select-value">{selected?.label}</span>
        <ChevronDown size={16} className="select-arrow" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="select-list"
          id={listId}
          role="listbox"
          ref={listRef}
          tabIndex={-1}
        >
          {options.map((opt, index) => (
            <li
              key={opt.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={opt.value === value}
              className={[
                'select-option',
                index === activeIndex ? 'is-active' : '',
                opt.value === value ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => commit(index)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
