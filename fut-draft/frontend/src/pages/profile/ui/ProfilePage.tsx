import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { useProfileStore } from "@/features/profile";
import { RoutePath } from "@/shared";

const MAX_AVATAR_FILE_SIZE = 450_000;

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const error = useProfileStore((state) => state.error);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const updateAvatar = useProfileStore((state) => state.updateAvatar);
  const [localError, setLocalError] = useState<string | null>(null);
  const isSaving = status === "saving";
  const displayedUser = profile ?? user;
  const avatarUrl = displayedUser?.avatarUrl ?? null;

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    await logout();
    navigate(RoutePath.login, { replace: true });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setLocalError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("Выбери файл изображения.");

      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setLocalError("Фотка слишком большая. Для MVP держим лимит около 450 KB.");

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setLocalError("Не получилось прочитать изображение.");

        return;
      }

      void updateAvatar(result);
    };

    reader.onerror = () => {
      setLocalError("Не получилось прочитать изображение.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-[#08110e] px-4 py-10 text-white">
      <div className="mx-auto mb-4 w-full max-w-5xl">
        <Link
          className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-amber-300/60 hover:text-white"
          to={RoutePath.main}
        >
          Назад
        </Link>
      </div>
      <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-[8px] border border-white/10 bg-[#13201a] p-5 shadow-2xl">
          <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-[8px] border border-amber-200/40 bg-black/25">
            {avatarUrl ? (
              <img
                alt={displayedUser?.nickname ?? "User avatar"}
                className="h-full w-full object-cover"
                src={avatarUrl}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-5xl font-black text-amber-200">
                {(displayedUser?.nickname ?? "P").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <input
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            ref={fileInputRef}
            type="file"
          />

          <button
            className="mt-5 h-11 w-full rounded-[8px] bg-amber-300 px-4 text-sm font-black uppercase tracking-[0.14em] text-[#17251f] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {isSaving ? "Сохраняем..." : "Поставить фотку"}
          </button>

          {avatarUrl ? (
            <button
              className="mt-3 h-11 w-full rounded-[8px] border border-white/15 px-4 text-sm font-black uppercase tracking-[0.14em] text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSaving}
              onClick={() => {
                setLocalError(null);
                void updateAvatar(null);
              }}
              type="button"
            >
              Убрать фотку
            </button>
          ) : null}

          {localError || error ? (
            <div className="mt-4 rounded-[8px] border border-red-400/40 bg-red-950/60 px-3 py-2 text-sm font-bold text-red-100">
              {localError ?? error}
            </div>
          ) : null}
        </aside>

        <section className="rounded-[8px] border border-white/10 bg-[#17251f] p-6 shadow-2xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
            Profile
          </p>
          <h1 className="mt-3 text-4xl font-black">
            {displayedUser?.nickname ?? "Player"}
          </h1>

          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[8px] bg-black/20 p-4">
              <dt className="text-sm text-white/55">Email</dt>
              <dd className="mt-1 font-semibold">{displayedUser?.email ?? "Unknown"}</dd>
            </div>
            <div className="rounded-[8px] bg-black/20 p-4">
              <dt className="text-sm text-white/55">Route user id</dt>
              <dd className="mt-1 break-all font-semibold">{userId}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                Участий
              </p>
              <strong className="mt-2 block text-4xl font-black text-white">
                {profile?.stats.tournamentsPlayed ?? 0}
              </strong>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                Побед
              </p>
              <strong className="mt-2 block text-4xl font-black text-lime-300">
                {profile?.stats.tournamentsWon ?? 0}
              </strong>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                Составов
              </p>
              <strong className="mt-2 block text-4xl font-black text-cyan-200">
                {profile?.stats.savedSquads ?? 0}
              </strong>
            </div>
          </div>

          <button
            className="mt-7 h-12 rounded-[8px] bg-amber-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#17251f] transition hover:bg-amber-200"
            onClick={handleLogout}
            type="button"
          >
            Выйти
          </button>
        </section>
      </section>
    </main>
  );
};

export default ProfilePage;
