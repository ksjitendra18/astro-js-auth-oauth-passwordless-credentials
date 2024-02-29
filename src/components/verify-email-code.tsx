import { Show, createSignal, type JSX } from "solid-js";

const VerifyEmailCode = ({ id }: { id: string }) => {
  const [verificationErr, setVerificationErr] = createSignal("");
  const [verificationSuccess, setVerificationSuccess] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    setVerificationErr("");
    setLoading(true);
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const enteredCode = formData.get("code") as string;

      if (enteredCode && enteredCode.length < 6) {
        setVerificationErr("Please enter a valid code");
        return;
      }
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          id,
          code: enteredCode,
        }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setVerificationErr(resData.message);
        return;
      }

      if (res.status === 200 && resData.data.emailVerified) {
        // window.location.replace("/login");
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

          <button class="rounded-md my-4 flex items-center justify-center gap-1 bg-black px-5 py-3 w-full text-white">
            <Show when={loading()}>
              <img src="/spinner.svg" class="animate-spin fill-white mr-2" />{" "}
              Verifying...
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

export default VerifyEmailCode;
