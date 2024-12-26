import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import { EmailVerificationSchema } from "../validations/email-verification";
import Loader2 from "lucide-solid/icons/loader-2";

export const EmailVerificationForm = ({ id }: { id: string }) => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [verificationSuccess, setVerificationSuccess] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<
      z.infer<typeof EmailVerificationSchema>,
      string
    > | null>(null);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setVerificationErr("");
    setLoading(true);
    setValidationIssue(null);
    try {
      const formData = new FormData(e.currentTarget);
      const enteredCode = formData.get("code") as string;

      const safeParsedData = EmailVerificationSchema.safeParse({
        id,
        code: enteredCode,
      });

      if (!safeParsedData.success) {
        setValidationIssue(safeParsedData.error.format());
        return;
      }
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        body: JSON.stringify(safeParsedData.data),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setVerificationErr(resData.message);
        return;
      }

      if (res.status === 200 && resData.data.emailVerified) {
        setVerificationSuccess(true);

        setTimeout(() => {
          window.location.replace("/login");
        }, 1000);
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
        <h1 class="text-3xl font-bold text-center">Verify</h1>
        <p>Enter the code received on email</p>
        <form onSubmit={handleSubmit} class="mx-auto mt-8 w-full">
          <input
            placeholder="Enter code"
            type="text"
            name="code"
            id="code"
            class="border-2 border-slate-600 px-3 py-2 w-full rounded-md"
          />

          <button
            disabled={loading()}
            class="rounded-md my-4 flex items-center justify-center gap-1 bg-black disabled:bg-black/60 px-5 py-3 w-full text-white"
          >
            <Show when={loading()}>
              <Loader2 class="animate-spin mx-auto" />
            </Show>
            <Show when={!loading()}>Verify</Show>
          </button>
        </form>

        <div>
          Didn't receive the code?
          <a
            href="/verify"
            class="ml-1 border-b-2 border-blue-500 font-semibold"
          >
            Retry again
          </a>
        </div>

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
        <Show when={verificationSuccess()}>
          <div class="bg-green-600 text-white px-3 py-2 rounded-md my-3">
            <p>
              Verification Success. Now you can{" "}
              <a href="/login">Log in. Redirecting to login page...</a>
            </p>
          </div>
        </Show>
      </div>
    </>
  );
};
