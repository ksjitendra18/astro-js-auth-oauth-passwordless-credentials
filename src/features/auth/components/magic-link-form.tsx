import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import { EmailSchema, type EmailSchemaType } from "../validations/email";
import Loader2 from "lucide-solid/icons/loader-2";

export const MagicLinkForm = ({
  verificationId,
}: {
  verificationId?: string;
}) => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [emailSent, setEmailSent] = createSignal(!!verificationId);

  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<EmailSchemaType, string> | null>(null);

  const handleSendEmail: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setVerificationErr("");
    setValidationIssue(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      const safeParsedData = EmailSchema.safeParse(email);

      if (!safeParsedData.success) {
        setValidationIssue(safeParsedData.error.format());
        return;
      }

      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({
          email: safeParsedData.data,
        }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        if (resData && resData.error === "validation_error") {
          setValidationIssue(resData.message);
        } else {
          setVerificationErr(resData.message);
        }
        return;
      }
      setEmailSent(true);
    } catch (error) {
      setVerificationErr("Unable to login. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setVerificationErr("");
    setValidationIssue(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const code = formData.get("code") as string;

      const res = await fetch("/api/auth/magic-link/verify-code", {
        method: "POST",
        body: JSON.stringify({
          code: code,
        }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        if (resData && resData.error === "validation_error") {
          setValidationIssue(resData.message);
        } else {
          setVerificationErr(resData.message);
        }
        return;
      } else {
        window.location.href = resData.redirect ?? "/dashboard";
      }
    } catch (error) {
      setVerificationErr("Unable to login. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Show when={!emailSent()}>
        <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
          <h1 class="text-3xl font-bold text-center">Login via Magic Link</h1>
          <form onSubmit={handleSendEmail} class="mx-auto mt-8 w-full">
            <input
              placeholder="Enter email"
              type="email"
              name="email"
              id="email"
              class="border-2 border-slate-600 px-3 py-2 w-full rounded-md"
              required
            />

            <button
              disabled={loading()}
              class="rounded-md my-4 flex items-center justify-center gap-1 bg-black disabled:bg-black/60 px-5 py-3 w-full text-white"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!loading()}>Send Mail</Show>
            </button>
          </form>

          <Show when={validationIssue()}>
            {validationIssue()?._errors.map((err) => (
              <>
                <div class="bg-red-500 text-white px-3 py-2 rounded-md my-3">
                  {err}
                </div>
              </>
            ))}
          </Show>
          <Show when={verificationErr()}>
            <div class="bg-red-500 text-white px-3 py-2 rounded-md my-3">
              {verificationErr()}
            </div>
          </Show>
        </div>
      </Show>

      <Show when={emailSent()}>
        <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
          <h1 class="text-3xl font-bold text-center">Login via Magic Link</h1>

          <p class="my-3 text-center mb-5">
            Mail Sent Successfully. Follow the link in the mail or enter the
            code below
          </p>

          <form onSubmit={handleVerifyCode} class="mx-auto mt-4 w-full">
            <input
              placeholder="Enter code"
              type="text"
              name="code"
              id="code"
              class="border-2 border-slate-600 px-3 py-2 w-full rounded-md"
              required
            />

            <button
              disabled={loading()}
              class="rounded-md my-4 flex items-center justify-center gap-1 bg-black disabled:bg-black/60 px-5 py-3 w-full text-white"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!loading()}>Login</Show>
            </button>
          </form>

          <Show when={validationIssue()}>
            {validationIssue()?._errors.map((err) => (
              <>
                <div class="bg-red-500 text-white px-3 py-2 rounded-md my-3">
                  {err}
                </div>
              </>
            ))}
          </Show>
          <Show when={verificationErr()}>
            <div class="bg-red-500 text-white px-3 py-2 rounded-md my-3">
              {verificationErr()}
            </div>
          </Show>

          <button disabled={loading()} onClick={() => setEmailSent(false)}>
            Didn't receive the email?
          </button>
        </div>
      </Show>
    </>
  );
};
