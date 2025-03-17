import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import { LoginSchema, type LoginSchemaType } from "../validations/login";

import Loader2 from "lucide-solid/icons/loader-2";
import Eye from "lucide-solid/icons/eye";
import EyeOff from "lucide-solid/icons/eye-off";
import { sanitizeRedirectUrl } from "../../../lib/url";

export const LoginForm = ({ url }: { url: URL }) => {
  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<LoginSchemaType, string> | null>(null);

  const [error, setError] = createSignal("");
  const [unverifiedEmail, setUnverifiedEmail] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);

  const handleLogin: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setValidationIssue(null);
    setLoading(true);
    setError("");
    setUnverifiedEmail(false);
    const formData = new FormData(e.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const safeParsedData = LoginSchema.safeParse({ email, password });

      if (!safeParsedData.success) {
        setValidationIssue(safeParsedData.error.format());

        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(safeParsedData.data),
      });

      if (res.status === 500) {
        setError("Internal Server Error. Try again later");
        return;
      }
      const resData = await res.json();

      if (res.status !== 200) {
        if (resData.error === "email_unverified") {
          setUnverifiedEmail(true);
        }
        setError(resData.message);
      }

      if (res.status === 302) {
        window.location.href = resData
          ? resData.redirect
          : "/verify-two-factor";
        return;
      }
      if (res.status === 200) {
        const redirect = url.searchParams.get("redirect");
        const sanitizedRedirect = sanitizeRedirectUrl(redirect);
        window.location.replace(sanitizedRedirect);
      }
    } catch (error) {
      setError("Error while login. Please try again later");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div class="flex w-full max-w-[400px] items-center justify-between">
        <form onSubmit={handleLogin} method="post" class="w-[100%] mx-auto ">
          <label for="email" class=" block text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class={`${
              validationIssue()?.email ? "border-red-600" : "border-slate-600"
            } px-3 w-full  py-2 rounded-md border-2`}
          />

          <Show when={validationIssue()?.email}>
            <div class="flex flex-col">
              {validationIssue()?.email?._errors?.map((err) => (
                <p class="my-5 bg-red-500  text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <div class="mt-5 flex items-center justify-between">
            <label for="password" class="  text-gray-600">
              Password
            </label>

            <a
              href="/forgot-password"
              class=" text-right w-full block text-gray-700"
            >
              Forgot password?
            </a>
          </div>
          <div class="relative">
            <input
              type={showPassword() ? "text" : "password"}
              name="password"
              id="password"
              required
              class={`${
                validationIssue()?.password
                  ? "border-red-600"
                  : "border-slate-600"
              }  px-3 w-full  py-2 rounded-md border-2`}
            />
            <button
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
              tabIndex={-1}
              aria-label={
                showPassword() ? "Password Visible" : "Password Invisible"
              }
            >
              {showPassword() ? (
                <Eye class="absolute top-2 right-2 text-gray-700 select-none" />
              ) : (
                <EyeOff class="absolute top-2 right-2 text-gray-700 select-none" />
              )}
            </button>
          </div>

          <Show when={validationIssue()?.password}>
            <div class="flex flex-col ">
              {validationIssue()?.password?._errors?.map((err) => (
                <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <Show when={error()}>
            <div class="my-5 bg-red-500 text-white rounded-md px-3 py-2">
              {error()}{" "}
              {unverifiedEmail() && (
                <a href="/verify" class="font-bold underline">
                  Verify Email
                </a>
              )}
            </div>
          </Show>
          <div class="flex justify-end">
            <button
              type="submit"
              disabled={loading()}
              class="bg-black disabled:bg-black/60 focus:ring-blue-700 focus:ring-4 ring-offset-2 mt-5 flex items-center justify-center w-full px-10 py-2 text-center rounded-md text-white  duration-100 ease-in"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin" />
              </Show>
              <Show when={!loading()}>Log in</Show>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
