import { createSignal, Show, type JSX } from "solid-js";
import Loader2 from "lucide-solid/icons/loader-2";

export const TwoFactorDisableForm = () => {
  const [loading, setLoading] = createSignal(false);
  const [msg, setMsg] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  const handleSubmit: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const verificationType = formData.get("verificationType");
    const enteredCode = formData.get("enteredCode");
    try {
      setLoading(true);
      setSuccess(false);
      setMsg("");

      const res = await fetch("/api/auth/two-factor/disable", {
        method: "POST",
        body: JSON.stringify({ enteredCode, verificationType }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setMsg(resData.message);
      } else {
        setSuccess(true);
        setMsg("Verification Success");

        window.location.href = "/account";
      }
    } catch (error) {
      setMsg("Server Error. Try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div class="flex max-w-xl mt-1 mx-auto items-center justify-center flex-col">
      <p class="text-center">
        Verify your identity to disable two-factor authentication
      </p>
      <form onSubmit={handleSubmit} class="mx-auto max-w-md mt-8 w-full">
        <label for="verificationType" class="block">
          Select Verification type
        </label>
        <select
          name="verificationType"
          class="mt-1 block w-full px-3 py-2 rounded-md"
        >
          <option value="totp">TOTP Code</option>
          <option value="recoveryCode">Recovery Code</option>
        </select>
        <input
          placeholder="Enter code"
          type="text"
          name="enteredCode"
          id="enteredCode"
          class="border-2 border-slate-600 px-3 my-5 py-2 w-full rounded-md"
          required
        />

        <button
          disabled={loading()}
          class="rounded-md my-4 flex items-center justify-center gap-1 bg-red-700  disabled:bg-red-600/60 px-5 py-3 w-full text-white"
        >
          <Show when={loading()}>
            <Loader2 class="animate-spin mx-auto" />
          </Show>
          <Show when={!loading()}>Disable Two Factor</Show>
        </button>
      </form>

      <div class="flex items-center justify-center w-full">
        {msg() && (
          <p
            class={`${
              success() ? "bg-green-600" : "bg-red-600"
            } my-5 rounded-md w-fit px-2 py-2 text-white`}
          >
            {msg()}
          </p>
        )}
      </div>
    </div>
  );
};
