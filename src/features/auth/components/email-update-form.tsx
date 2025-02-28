import Loader2 from "lucide-solid/icons/loader-2";
import { createSignal, Show, type JSX } from "solid-js";
import * as z from "zod";
import { EmailSchema } from "../validations/email";
import {
  UpdateEmailSchema,
  type UpdateEmailSchemaType,
} from "../validations/update-email";

export const EmailUpdateForm = ({ currentEmail }: { currentEmail: string }) => {
  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<UpdateEmailSchemaType, string> | null>(
      null
    );

  const [newEmail, setNewEmail] = createSignal("");
  const [isNewEmailValid, setIsNewEmailValid] = createSignal(false);

  const [sendingEmailOtp, setSendingEmailOtp] = createSignal({
    currentEmail: false,
    newEmail: false,
  });

  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const [emailSendingError, setEmailSendingError] = createSignal("");

  const [otpSent, setOtpSent] = createSignal({
    currentEmail: false,
    newEmail: false,
  });

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setValidationIssue(null);
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    const currentEmail = formData.get("currentEmail");
    const newEmail = formData.get("newEmail");
    const currentEmailOtp = formData.get("currentEmailOtp");
    const newEmailOtp = formData.get("newEmailOtp");

    try {
      const safeParsedData = UpdateEmailSchema.safeParse({
        currentEmail,
        currentEmailOtp,
        newEmail,
        newEmailOtp,
      });

      if (!safeParsedData.success) {
        setValidationIssue(safeParsedData.error.format());
        return;
      }

      const res = await fetch("/api/auth/email", {
        method: "PATCH",
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

  const sendOtp = async ({
    email,
    type,
  }: {
    email: string;
    type: "currentEmail" | "newEmail";
  }) => {
    setEmailSendingError("");
    setSendingEmailOtp((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await fetch("/api/auth/email/request-change", {
        method: "POST",
        body: JSON.stringify({ email, type }),
      });

      const resData = await res.json();

      if (res.status === 200) {
        setError("");

        setOtpSent((prev) => ({ ...prev, [type]: true }));
      } else {
        setEmailSendingError(resData?.message ?? "Error while sending OTP");
      }
    } catch (error) {
      setEmailSendingError("Error while sending OTP");
    } finally {
      setSendingEmailOtp((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleNewEmailChange = (e: Event) => {
    setError("");
    const target = e.target as HTMLInputElement;
    setNewEmail(target.value);
    const parsedData = EmailSchema.safeParse(target.value);
    if (parsedData.data?.toLowerCase() === currentEmail.toLowerCase()) {
      setIsNewEmailValid(false);
      setError("New email cannot be the same as the current email");
      return;
    }
    setIsNewEmailValid(parsedData.success);
  };
  return (
    <div class="flex items-center justify-center">
      <div class="flex w-full max-w-[400px] items-center justify-between">
        <form onSubmit={handleSubmit} method="post" class="w-[100%] mx-auto ">
          <label for="currentEmail" class="mt-5 block text-gray-600">
            Current Email
          </label>

          <input
            type="email"
            name="currentEmail"
            id="currentEmail"
            value={currentEmail}
            readOnly
            required
            class={"px-3 border-slate-600 w-full  py-2 rounded-md border-2"}
          />

          <Show when={!otpSent().currentEmail}>
            <button
              type="button"
              onClick={() => {
                sendOtp({ email: currentEmail, type: "currentEmail" });
              }}
              disabled={Object.values(sendingEmailOtp()).includes(true)}
              class="my-3 text-center rounded-md w-full border-2 border-black  py-2 disabled:cursor-not-allowed"
            >
              <Show when={sendingEmailOtp().currentEmail}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!sendingEmailOtp().currentEmail}>
                Send OTP to Current Email
              </Show>
            </button>
          </Show>

          <Show when={otpSent().currentEmail}>
            <input
              type="text"
              name="currentEmailOtp"
              required
              minLength={6}
              maxLength={6}
              class="w-full px-4 py-2 my-3 text-lg tracking-widest text-center border rounded-md focus:ring-2  disabled:bg-gray-100"
              placeholder="Enter OTP"
            />
            <button
              type="button"
              onClick={() => {
                setOtpSent((prev) => ({ ...prev, currentEmail: false }));
              }}
            >
              Didn't receive the code? Retry
            </button>
          </Show>

          <label for="newEmail" class="mt-5 block text-gray-600">
            New Email
          </label>
          <input
            type="email"
            name="newEmail"
            id="newEmail"
            value={newEmail()}
            onInput={handleNewEmailChange}
            required
            class={`${
              validationIssue()?.newEmail
                ? "border-red-600"
                : "border-slate-600"
            }  px-3 w-full  py-2 rounded-md border-2`}
          />

          <Show when={isNewEmailValid() && !otpSent().newEmail}>
            <button
              type="button"
              onClick={() => {
                sendOtp({ email: newEmail(), type: "newEmail" });
              }}
              disabled={Object.values(sendingEmailOtp()).includes(true)}
              class="my-3 text-center rounded-md w-full border-2 border-black  py-2 disabled:cursor-not-allowed"
            >
              <Show when={sendingEmailOtp().newEmail}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!sendingEmailOtp().newEmail}>
                Send OTP to New Email
              </Show>
            </button>
          </Show>

          <Show when={otpSent().newEmail}>
            <input
              type="text"
              name="newEmailOtp"
              maxLength={6}
              minLength={6}
              required
              class="w-full px-4 py-2 my-3 text-lg tracking-widest text-center border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter OTP"
            />

            <button
              type="button"
              onClick={() => {
                setOtpSent((prev) => ({ ...prev, currentEmail: false }));
              }}
            >
              Didn't receive the code? Retry
            </button>
          </Show>

          <Show when={validationIssue()?.newEmail}>
            <div class="flex flex-col ">
              {validationIssue()?.newEmail?._errors?.map((err) => (
                <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <Show when={error() || emailSendingError()}>
            <div class="my-5 bg-red-500 text-white rounded-md px-3 py-2">
              {error()} {emailSendingError()}
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
              <Show when={!loading()}>Update Email</Show>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
