import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import EmailSchema, { type EmailSchemaType } from "../validations/email";

const MagicLinkForm = () => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [verificationSuccess, setVerificationSuccess] = createSignal(false);

  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<EmailSchemaType, string> | null>(null);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    setVerificationErr("");
    setValidationIssue(null);
    setVerificationSuccess(false);
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
      setVerificationSuccess(true);
    } catch (error) {
      setVerificationErr("Unable to login. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
        <h1 class="text-3xl font-bold text-center">Login via Magic Link</h1>
        <p>Enter the email</p>
        <form onSubmit={handleSubmit} class="mx-auto mt-8 w-full">
          <input
            placeholder="Enter email"
            type="email"
            name="email"
            id="email"
            class="border-2 border-slate-600 px-3 py-2 w-full rounded-md"
            required
          />

          <button class="rounded-md my-4 flex items-center justify-center gap-1 bg-black px-5 py-3 w-full text-white">
            <Show when={loading()}>
              <img src="/spinner.svg" class="animate-spin fill-white mr-2" />{" "}
              Sending Mail...
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

        <Show when={verificationSuccess()}>
          <div class="bg-green-600 text-white px-3 py-2 rounded-md my-3">
            <p>
              Mail Sent Successfully. Follow the link in the mail to log in.
            </p>
          </div>
        </Show>
      </div>
    </>
  );
};

export default MagicLinkForm;
