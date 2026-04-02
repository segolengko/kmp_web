"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./dark-select.module.css";

type DarkSelectOption = {
  label: string;
  value: string;
};

type DarkSelectProps = {
  id: string;
  name?: string;
  value: string;
  options: DarkSelectOption[];
  onChange?: (value: string) => void;
};

export function DarkSelect({
  id,
  name,
  value,
  options,
  onChange,
}: DarkSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0] ?? null;

  return (
    <div className={styles.wrapper} ref={rootRef}>
      {name ? (
        <input className={styles.hiddenInput} name={name} type="hidden" value={selectedValue} />
      ) : null}
      <button
        aria-controls={`${id}-menu`}
        aria-expanded={isOpen}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={styles.label}>{selectedOption?.label ?? "Pilih"}</span>
        <span className={styles.chevron}>▼</span>
      </button>

      {isOpen ? (
        <div className={styles.menu} id={`${id}-menu`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedValue}
              className={`${styles.option} ${option.value === selectedValue ? styles.optionActive : ""}`}
              key={option.value}
              onClick={() => {
                setSelectedValue(option.value);
                onChange?.(option.value);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>{option.label}</span>
              {option.value === selectedValue ? <span className={styles.check}>Aktif</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
