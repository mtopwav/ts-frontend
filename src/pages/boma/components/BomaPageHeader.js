import React from 'react';
import { FaBars, FaSignOutAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';
import ThemeToggle from '../../../components/ThemeToggle';
import LanguageSelector from '../../../components/LanguageSelector';
import { useTranslation } from '../../../utils/useTranslation';
import { bomaLabels, bomaUserName } from '../bomaLabels';
import { capitalizeName } from '../bomaUtils';

export default function BomaPageHeader({
  title,
  user,
  currentDateTime,
  onToggleSidebar,
  onLogout,
}) {
  const { t } = useTranslation();

  return (
    <header className="payments-header boma-page-header">
      <div className="header-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <FaBars />
        </button>
        <div className="boma-page-title-block">
          <span className="boma-page-kicker">{bomaLabels.branch}</span>
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      <div className="header-right">
        {currentDateTime ? (
          <div className="manager-date-time boma-date-time">
            <FaCalendarAlt aria-hidden />
            <span>{currentDateTime}</span>
          </div>
        ) : null}
        <ThemeToggle />
        <LanguageSelector />
        <div className="user-info boma-user-chip">
          <FaUser className="user-icon" aria-hidden />
          <span className="user-name">{capitalizeName(bomaUserName(user))}</span>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          <FaSignOutAlt aria-hidden /> {t.logout}
        </button>
      </div>
    </header>
  );
}
