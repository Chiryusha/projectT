import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { RoutePath } from "@/shared";

type LoginLocationState = {
  from?: Location;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState("demo@futdraft.local");
  const [password, setPassword] = useState("Demo12345!");

  const locationState = location.state as LoginLocationState | null;
  const redirectTo = locationState?.from?.pathname ?? RoutePath.draft;
  const isSubmitting = status === "loading";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch {
      // The store exposes a normalized error message for the form.
    }
  };

  return (
    <main className="min-h-screen bg-[#101915] px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-white/10 bg-[#17251f] shadow-2xl md:grid-cols-[1fr_0.85fr]">
          <div className="flex min-h-[520px] flex-col justify-between bg-[linear-gradient(135deg,rgba(75,133,86,0.96),rgba(17,37,29,0.96))] p-8">
            <Link
              className="w-fit text-sm font-semibold uppercase tracking-[0.18em] text-white/75 transition hover:text-white"
              to={RoutePath.main}
            >
              FUT Draft
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                Draft MVP
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Собери состав и проверь его в турнире
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/75">
                Войди в аккаунт, выбери формацию и начинай драфт из пяти
                вариантов на каждый слот.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm text-white/75">
              <div className="rounded-[8px] bg-black/18 p-3">
                <strong className="block text-xl text-white">18</strong>
                слотов
              </div>
              <div className="rounded-[8px] bg-black/18 p-3">
                <strong className="block text-xl text-white">5</strong>
                карт
              </div>
              <div className="rounded-[8px] bg-black/18 p-3">
                <strong className="block text-xl text-white">33</strong>
                химия
              </div>
            </div>
          </div>

          <form className="flex flex-col justify-center p-6 sm:p-8" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                Авторизация
              </p>
              <h2 className="mt-3 text-3xl font-black">Вход</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Демо-аккаунт уже подставлен, можно сразу проверить поток.
              </p>
            </div>

            <label className="mt-8 block text-sm font-semibold text-white/80">
              Email
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="login-email"
                onChange={(event) => {
                  clearError();
                  setEmail(event.target.value);
                }}
                placeholder="demo@futdraft.local"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="mt-5 block text-sm font-semibold text-white/80">
              Пароль
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-white/10 bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-amber-300"
                data-testid="login-password"
                minLength={8}
                onChange={(event) => {
                  clearError();
                  setPassword(event.target.value);
                }}
                placeholder="Demo12345!"
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-[8px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            <button
              className="mt-7 h-12 rounded-[8px] bg-amber-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#17251f] transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
              data-testid="login-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </button>

            <p className="mt-6 text-center text-sm text-white/60">
              Нет аккаунта?{" "}
              <Link className="font-bold text-amber-300 hover:text-amber-200" to={RoutePath.register}>
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
