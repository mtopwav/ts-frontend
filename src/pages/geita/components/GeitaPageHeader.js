import React from 'react';
import { FaBars, FaSignOutAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';
import ThemeToggle from '../../../components/ThemeToggle';
import LanguageSelector from '../../../components/LanguageSelector';
import { useTranslation } from '../../../utils/useTranslation';
import { geitaLabels, geitaUserName } from '../geitaLabels';
import { capitalizeName } from '../geitaUtils';

export default function GeitaPageHeader({
  title,
  user,
  currentDateTime,
  onToggleSidebar,
  onLogout,
}) {
  const { t } = useTranslation();

  return (
    <header className="payments-header geita-page-header">
      <div className="header-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <FaBars />
        </button>
        <div className="geita-page-title-block">
          <span className="geita-page-kicker">{geitaLabels.branch}</span>
          <h1 className="page-title">{title}</h1>
        </div>
      </div>
      <div className="header-right">
        {currentDateTime ? (
          <div className="manager-date-time geita-date-time">
            <FaCalendarAlt aria-hidden />
            <span>{currentDateTime}</span>
          </div>
        ) : null}
        <ThemeToggle />
        <LanguageSelector />
        <div className="user-info geita-user-chip">
          <FaUser className="user-icon" aria-hidden />
          <span className="user-name">{capitalizeName(geitaUserName(user))}</span>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          <FaSignOutAlt aria-hidden /> {t.logout}
        </button>
      </div>
    </header>
  );
}
