import { Show, createSignal, type JSX } from "solid-js";
import PasswordSchema from "../validations/password";
import { z } from "zod";

const SetNewPassword = ({ id }: { id: string }) => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [verificationSuccess, setVerificationSuccess] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);

  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<
      z.infer<typeof PasswordSchema>,
      string
    > | null>(null);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    setVerificationErr("");
    setLoading(true);
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const newPassword = formData.get("password") as string;
      const confirmNewPassword = formData.get("confirmPassword") as string;

      if (newPassword !== confirmNewPassword) {
        setVerificationErr("Password do not match");
        return;
      }

      if (!id) {
        setVerificationErr("Pass a valid ID");
      }

      const parsedPassword = PasswordSchema.safeParse(newPassword);

      if (!parsedPassword.success) {
        setValidationIssue(parsedPassword.error.format());
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          id,
          password: newPassword,
        }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setVerificationErr(resData.message);
        return;
      }

      if (res.status === 200) {
        setVerificationSuccess(true);

        setTimeout(() => {
          window.location.replace("/login");
        }, 1000);
      }
    } catch (error) {
      setVerificationErr("Unable to reset password. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
        <h1 class="text-3xl font-bold text-center">Set New Password</h1>

        <form
          onSubmit={handleSubmit}
          class="mx-auto flex flex-col gap-4 mt-8 w-full"
        >
          <div class="relative">
            <input
              type={showPassword() ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Enter New Password"
              required
              class={`${
                validationIssue()?._errors
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
          <div class="relative">
            <input
              type={showConfirmPassword() ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Confirm New Password"
              required
              class={`${
                validationIssue()?._errors
                  ? "border-red-600"
                  : "border-slate-600"
              }  px-3 w-full  py-2 rounded-md border-2`}
            />
            <button
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              type="button"
              tabIndex={-1}
              aria-label="Password Invisible."
            >
              {showConfirmPassword() ? (
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

          <Show when={validationIssue()?._errors}>
            <div class="flex flex-col">
              {validationIssue()?._errors?.map((err) => (
                <p class="my-5 bg-red-500  text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>
          <button class="rounded-md my-4 flex items-center justify-center gap-1 bg-black px-5 py-3 w-full text-white">
            <Show when={loading()}>
              <img src="/spinner.svg" class="animate-spin fill-white mr-2" />{" "}
              Resetting...
            </Show>
            <Show when={!loading()}>Reset Password</Show>
          </button>
        </form>

        <Show when={verificationErr()}>
          <div class="bg-red-500 text-white px-3 py-2 rounded-md my-3">
            {verificationErr()}
          </div>
        </Show>
        <Show when={verificationSuccess()}>
          <div class="bg-green-600 text-white px-3 py-2 rounded-md my-3">
            <p>
              Password Reset Success. Now you can{" "}
              <a href="/login">Log in. Redirecting to login page...</a>
            </p>
          </div>
        </Show>
      </div>
    </>
  );
};

export default SetNewPassword;
