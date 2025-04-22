import { createSignal, Show, type JSX } from "solid-js";
import * as z from "zod";
import {
  UpdatePasswordSchema,
  type UpdatePasswordSchemaType,
} from "../validations/update-password";
import Loader2 from "lucide-solid/icons/loader-2";

export const PasswordUpdateForm = () => {
  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<UpdatePasswordSchemaType, string> | null>(
      null
    );

  const [error, setError] = createSignal("");

  const [loading, setLoading] = createSignal(false);
  const [showOldPassword, setShowOldPassword] = createSignal(false);
  const [showNewPassword, setShowNewPassword] = createSignal(false);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setValidationIssue(null);
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const oldPassword = formData.get("oldPassword");
    const newPassword = formData.get("newPassword");

    try {
      const safeParsedData = UpdatePasswordSchema.safeParse({
        oldPassword,
        newPassword,
      });

      if (!safeParsedData.success) {
        setValidationIssue(safeParsedData.error.format());

        return;
      }

      const res = await fetch("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify(safeParsedData.data),
      });

      const resData = await res.json();

      if (res.status === 200) {
        window.location.replace("/account");
      } else {
        setError(resData.message);
      }
    } catch (error) {
      setError("Error while updating password. Please try again later");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div class="flex items-center justify-center">
      <div class="flex w-full max-w-[400px] items-center justify-between">
        <form onSubmit={handleSubmit} method="post" class="w-[100%] mx-auto ">
          <label for="oldPassword" class="mt-5 block text-gray-600">
            Old Password
          </label>
          <div class="relative">
            <input
              type={showOldPassword() ? "text" : "password"}
              name="oldPassword"
              id="oldPassword"
              required
              class={`${
                validationIssue()?.oldPassword
                  ? "border-red-600"
                  : "border-slate-600"
              }  px-3 w-full  py-2 rounded-md border-2`}
            />
            <button
              onClick={() => setShowOldPassword((prev) => !prev)}
              type="button"
              tabIndex={-1}
              aria-label="Password Invisible."
            >
              {showOldPassword() ? (
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

          <Show when={validationIssue()?.oldPassword}>
            <div class="flex flex-col ">
              {validationIssue()?.oldPassword?._errors?.map((err) => (
                <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <label for="newPassword" class="mt-5 block text-gray-600">
            New Password
          </label>
          <div class="relative">
            <input
              type={showNewPassword() ? "text" : "password"}
              name="newPassword"
              id="newPassword"
              required
              class={`${
                validationIssue()?.newPassword
                  ? "border-red-600"
                  : "border-slate-600"
              }  px-3 w-full  py-2 rounded-md border-2`}
            />
            <button
              onClick={() => setShowNewPassword((prev) => !prev)}
              type="button"
              tabIndex={-1}
              aria-label="Password Invisible."
            >
              {showNewPassword() ? (
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

          <Show when={validationIssue()?.newPassword}>
            <div class="flex flex-col ">
              {validationIssue()?.newPassword?._errors?.map((err) => (
                <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <Show when={error()}>
            <div class="my-5 bg-red-500 text-white rounded-md px-3 py-2">
              {error()}
            </div>
          </Show>
          <div class="flex justify-end">
            <button
              disabled={loading()}
              class="rounded-md my-4 flex items-center justify-center gap-1 bg-black disabled:bg-black/60 px-5 py-3 w-full text-white"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!loading()}>Update Password</Show>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
