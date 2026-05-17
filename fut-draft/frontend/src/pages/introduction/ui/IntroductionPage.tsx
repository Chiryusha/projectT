import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { RoutePath } from "@/shared";

import firstPageImage from "../../../shared/assets/intro.png";
import logoImage from "../../../shared/assets/logo1.png";
import "./IntroductionPage.scss";

type MenuIcon = "ball" | "squad" | "profile" | "settings";

type MenuButton = {
  icon: MenuIcon;
  label: string;
  getPath: (userId?: string) => string;
};

const menuButtons: MenuButton[] = [
  {
    icon: "ball",
    label: "Начать драфт",
    getPath: () => RoutePath.draft,
  },
  {
    icon: "squad",
    label: "Составы",
    getPath: () => RoutePath.lineups,
  },
  {
    icon: "profile",
    label: "Профиль",
    getPath: (userId) => (userId ? RoutePath.getProfile(userId) : RoutePath.login),
  },
  {
    icon: "settings",
    label: "Настройки",
    getPath: () => RoutePath.settings,
  },
];

const MenuIcon = ({ icon }: { icon: MenuIcon }) => {
  if (icon === "ball") {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" />
        <path d="M32 14l11 8-4 13H25l-4-13 11-8z" />
        <path d="M18 26l-8 7m36-7 8 7M25 35l-8 14m22-14 8 14M32 14V4" />
      </svg>
    );
  }

  if (icon === "squad") {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <circle cx="32" cy="20" r="9" />
        <circle cx="16" cy="26" r="7" />
        <circle cx="48" cy="26" r="7" />
        <path d="M18 54c1-12 7-19 14-19s13 7 14 19H18z" />
        <path d="M5 52c1-9 5-14 11-14 4 0 8 3 10 7M59 52c-1-9-5-14-11-14-4 0-8 3-10 7" />
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <circle cx="32" cy="20" r="11" />
        <path d="M14 56c2-14 9-22 18-22s16 8 18 22H14z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <path d="M32 7l5 9 10 2 2 10 8 6-5 9 1 11-11 1-10 5-9-5-11-1 1-11-5-9 8-6 2-10 10-2 4-9z" />
      <circle cx="32" cy="34" r="10" />
    </svg>
  );
};

const IntroductionPage = () => {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);

  return (
    <main
      className="intro-page"
      style={{ backgroundImage: `url(${firstPageImage})` }}
    >
      <div className="intro-page__content">
        <img className="intro-page__logo-image" src={logoImage} alt="SquadDraft" />

        <nav className="intro-page__menu" aria-label="Главное меню">
          {menuButtons.map((item) => (
            <button
              className="intro-page__menu-button"
              data-testid={`intro-${item.icon}-button`}
              key={item.label}
              onClick={() => navigate(item.getPath(userId))}
              type="button"
            >
              <span className="intro-page__menu-icon">
                <MenuIcon icon={item.icon} />
              </span>
              <span className="intro-page__menu-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
};

export default IntroductionPage;
