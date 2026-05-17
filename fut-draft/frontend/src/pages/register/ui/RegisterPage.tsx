import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { RoutePath } from "@/shared";

const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isSubmitting = status === "loading";
  const formError = localError ?? error;

  const resetErrors = () => {
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== passwordRepeat) {
      setLocalError("Пароли не совпадают");

      return;
    }

    try {
      await register({ nickname, email, password });
      navigate(RoutePath.draft, { replace: true });
    } catch {
      // The store exposes a normalized error message for the form.
    }
  };

  return (
    <main className="min-h-screen bg-[#101915] px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-white/10 bg-[#17251f] shadow-2xl md:grid-cols-[0.85fr_1fr]">
          <form className="flex flex-col justify-center p-6 sm:p-8" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                Новый аккаунт
              </p>
              <h1 className="mt-3 text-3xl font-black">Регистрация</h1>
              <p className="mt-2 text-sm leading-6 text-white/60">
                После регистрации ты сразу попадешь на страницу драфта.
              </p>
            </div>

            <label className="mt-8 block text-sm font-semibold text-white/80">
              Никнейм
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="register-nickname"
                maxLength={24}
                minLength={3}
                onChange={(event) => {
                  resetErrors();
                  setNickname(event.target.value);
                }}
                placeholder="draft_boss"
                required
                type="text"
                value={nickname}
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-white/80">
              Email
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="register-email"
                onChange={(event) => {
                  resetErrors();
                  setEmail(event.target.value);
                }}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-white/80">
              Пароль
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="register-password"
                maxLength={128}
                minLength={8}
                onChange={(event) => {
                  resetErrors();
                  setPassword(event.target.value);
                }}
                required
                type="password"
                value={password}
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-white/80">
              Повтор пароля
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="register-password-repeat"
                maxLength={128}
                minLength={8}
                onChange={(event) => {
                  resetErrors();
                  setPasswordRepeat(event.target.value);
                }}
                required
                type="password"
                value={passwordRepeat}
              />
            </label>

            {formError ? (
              <p className="mt-4 rounded-[8px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {formError}
              </p>
            ) : null}

            <button
              className="mt-7 h-12 rounded-[8px] bg-amber-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#17251f] transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
              data-testid="register-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Создаем..." : "Создать аккаунт"}
            </button>

            <p className="mt-6 text-center text-sm text-white/60">
              Уже есть аккаунт?{" "}
              <Link className="font-bold text-amber-300 hover:text-amber-200" to={RoutePath.login}>
                Войти
              </Link>
            </p>
          </form>

          <div className="flex min-h-[560px] flex-col justify-between bg-[linear-gradient(135deg,rgba(26,45,38,0.96),rgba(78,120,64,0.94))] p-8">
            <Link
              className="w-fit text-sm font-semibold uppercase tracking-[0.18em] text-white/75 transition hover:text-white"
              to={RoutePath.main}
            >
              FUT Draft
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                Squad Builder
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Драфт, химия, турнир
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/75">
                MVP уже имеет backend для выбора карт, подсчета химии и
                симуляции сетки. Осталось собрать удобный фронт.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-white/75">
              <div className="rounded-[8px] bg-black/18 p-4">
                <strong className="block text-lg text-white">JWT auth</strong>
                access + refresh
              </div>
              <div className="rounded-[8px] bg-black/18 p-4">
                <strong className="block text-lg text-white">Zustand</strong>
                общий session state
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
