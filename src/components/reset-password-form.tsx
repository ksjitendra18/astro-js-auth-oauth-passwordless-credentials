import { Show, createSignal, type JSX } from "solid-js";

const ForgotPasswordForm = () => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [verificationMsg, setVerificationMsg] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    setVerificationErr("");
    setVerificationMsg("");
    setLoading(true);
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      const res = await fetch("/api/auth/password-reset-mail", {
        method: "POST",
        body: JSON.stringify({
          email,
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
        <p>Get the email for resetting password</p>
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

export default ForgotPasswordForm;
