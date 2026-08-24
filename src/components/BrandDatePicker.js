import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatDate } from '../utils/dateTime';
import './BrandDatePicker.css';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYmd(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(viewDate) {
  const first = startOfMonth(viewDate);
  // Monday-first index: Sun=0 -> 6, Mon=1 -> 0, ...
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Custom calendar date picker (native OS calendar cannot be styled).
 */
export default function BrandDatePicker({
  id,
  label,
  value = '',
  onChange,
  min,
  max,
  placeholder = 'Select date',
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const [viewDate, setViewDate] = useState(() => selected || new Date());

  useEffect(() => {
    if (selected) setViewDate(startOfMonth(selected));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const minDate = parseYmd(min);
  const maxDate = parseYmd(max);
  const todayYmd = toYmd(new Date());

  const isDisabled = (day) => {
    const ymd = toYmd(day);
    if (minDate && ymd < toYmd(minDate)) return true;
    if (maxDate && ymd > toYmd(maxDate)) return true;
    return false;
  };

  const pickDay = (day) => {
    if (isDisabled(day)) return;
    onChange?.(toYmd(day));
    setOpen(false);
  };

  const displayValue = value ? formatDate(value) || value : '';

  return (
    <div className="brand-datepicker" ref={rootRef}>
      {label ? (
        <label className="brand-datepicker-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        className={'brand-datepicker-trigger' + (value ? ' has-value' : '') + (open ? ' open' : '')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <FaCalendarAlt className="brand-datepicker-icon" aria-hidden />
        <span>{displayValue || placeholder}</span>
        <FaChevronDown className="brand-datepicker-caret" aria-hidden />
      </button>

      {open && (
        <div className="brand-datepicker-popup" role="dialog" aria-label="Choose date">
          <div className="brand-datepicker-header">
            <span className="brand-datepicker-month">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <div className="brand-datepicker-nav">
              <button
                type="button"
                className="brand-datepicker-nav-btn"
                aria-label="Previous month"
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                className="brand-datepicker-nav-btn"
                aria-label="Next month"
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="brand-datepicker-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="brand-datepicker-grid">
            {days.map((day) => {
              const ymd = toYmd(day);
              const inMonth = day.getMonth() === viewDate.getMonth();
              const selectedDay = value === ymd;
              const isToday = ymd === todayYmd;
              const disabled = isDisabled(day);
              return (
                <button
                  key={ymd + String(inMonth)}
                  type="button"
                  disabled={disabled}
                  className={[
                    'brand-datepicker-day',
                    inMonth ? 'in-month' : 'out-month',
                    selectedDay ? 'selected' : '',
                    isToday ? 'today' : '',
                    disabled ? 'disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pickDay(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="brand-datepicker-footer">
            <button
              type="button"
              className="brand-datepicker-footer-btn"
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="brand-datepicker-footer-btn"
              onClick={() => {
                const today = new Date();
                if (!isDisabled(today)) {
                  onChange?.(toYmd(today));
                  setViewDate(startOfMonth(today));
                  setOpen(false);
                }
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
