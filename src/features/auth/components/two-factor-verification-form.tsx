import { Show, createSignal, type JSX } from "solid-js";
import Loader2 from "lucide-solid/icons/loader-2";

export const TwoFactorVerificationForm = () => {
  const [loading, setLoading] = createSignal(false);
  const [msg, setMsg] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const enteredCode = formData.get("enteredCode");
    try {
      setLoading(true);
      setSuccess(false);
      setMsg("");

      const res = await fetch("/api/auth/two-factor/verify", {
        method: "POST",
        body: JSON.stringify({ enteredCode }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setMsg(resData.message);
      } else {
        setSuccess(true);
        setMsg("Verification Success");

        setTimeout(() => {
          window.location.href = "/account";
        }, 1000);
      }
    } catch (error) {
      setMsg("Server Error. Try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div class="flex max-w-[400px] mt-32 mx-auto items-center justify-center flex-col">
      <h1 class="text-3xl font-bold text-center">2 Factor Verification</h1>

      <form onSubmit={handleSubmit} class="mx-auto mt-8 w-full">
        <input
          placeholder="Enter 6 digit code"
          type="text"
          name="enteredCode"
          id="enteredCode"
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
          <Show when={!loading()}>Verify</Show>
        </button>
      </form>

      <p>
        Lost Access to Two Factor Auth?
        <a class="font-semibold underline ml-1" href="/verify-recovery-code">
          Use Recovery Code
        </a>
      </p>

      <div class="flex items-center justify-center w-full">
        {msg() && (
          <p
            class={`
          ${success() ? "bg-green-600" : "bg-red-600"}
           my-5 rounded-md w-fit px-2 py-2 text-white`}
          >
            {msg()}
          </p>
        )}
      </div>
    </div>
  );
};
