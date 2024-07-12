import LoginSchema from "../validations/login";
import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";

const LoginForm = () => {
  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<
      z.infer<typeof LoginSchema>,
      string
    > | null>(null);

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

      if (res.status === 200) {
        window.location.replace("/dashboard");
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

          <label for="password" class="mt-5 block text-gray-600">
            Password
          </label>
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
              aria-label="Password Invisible."
            >
              {showPassword() ? (
                <img
                  src="/eye-icon.svg"
                  class="w-6 select-none text-gray-700 cursor-pointer h-6 absolute top-2 right-2"
                  width="20px"
                />
              ) : (
                <img
                  src="/eye-close.svg"
                  class="w-6 select-none text-gray-700 cursor-pointer h-6 absolute top-2 right-2"
                  width="20px"
                />
              )}
            </button>
          </div>

          <a
            href="/forgot-password"
            class="my-2 text-right w-full block text-gray-700"
          >
            Forgot password?
          </a>

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
              class="bg-black focus:ring-blue-700 focus:ring-4 ring-offset-2 mt-5 flex items-center justify-center w-full px-10 py-2 text-center rounded-md text-white hover:scale-95 duration-100 ease-in"
            >
              <Show when={loading()}>
                <img src="/spinner.svg" class="animate-spin fill-white mr-2" />{" "}
                Log in...
              </Show>
              <Show when={!loading()}>Log in</Show>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
