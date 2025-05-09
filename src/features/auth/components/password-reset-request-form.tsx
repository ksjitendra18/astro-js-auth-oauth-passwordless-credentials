import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import { EmailSchema, type EmailSchemaType } from "../validations/email";
import Loader2 from "lucide-solid/icons/loader-2";

export const PasswordResetRequestForm = () => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [verificationMsg, setVerificationMsg] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<EmailSchemaType, string> | null>(null);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setVerificationErr("");
    setVerificationMsg("");
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

      const res = await fetch("/api/auth/password/request-reset", {
        method: "POST",
        body: JSON.stringify({
          email: safeParsedData.data,
        }),
      });

      const resData = await res.json();

      if (res.status === 200) {
        setVerificationMsg(resData.message);
      } else {
        setVerificationErr(resData.message);
        return;
      }
    } catch (error) {
      setVerificationErr("Unable to verify. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
        <h1 class="text-3xl font-bold text-center">Reset Password</h1>
        <form onSubmit={handleSubmit} class="mx-auto mt-8 w-full">
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
        <Show when={verificationMsg()}>
          <div class="bg-green-600 text-white px-3 py-2 rounded-md my-3">
            <p>{verificationMsg()}</p>
          </div>
        </Show>
      </div>
    </>
  );
};
