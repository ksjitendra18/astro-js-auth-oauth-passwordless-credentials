import { createSignal, Show, type JSX } from "solid-js";
import Loader2 from "lucide-solid/icons/loader-2";

export const AccountDeletionForm = ({
  email,
  hasRecentlySentCode,
}: {
  email: string;
  hasRecentlySentCode: boolean;
}) => {
  const [loading, setLoading] = createSignal(false);
  const [msg, setMsg] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  const [codeSent, setCodeSent] = createSignal(hasRecentlySentCode);

  const handleSendCode: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");

    try {
      setLoading(true);
      setCodeSent(false);
      setMsg("");

      const res = await fetch("/api/auth/account/request-deletion", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setMsg(resData.message);
      } else {
        setCodeSent(true);
      }
    } catch (error) {
      setMsg("Server Error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const enteredCode = formData.get("enteredCode");
    const confirmationText = formData.get("confirmationText");

    if (confirmationText !== "delete my account") {
      setMsg("Invalid confirmation text");
      return;
    }
    try {
      setLoading(true);
      setSuccess(false);
      setMsg("");

      const res = await fetch("/api/auth/account/delete", {
        method: "POST",
        body: JSON.stringify({ enteredCode, email }),
      });

      const resData = await res.json();

      if (res.status !== 200) {
        setMsg(resData.message);
      } else {
        setSuccess(true);
        setMsg("Account deleted successfully");

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
      {!codeSent() ? (
        <>
          <form onSubmit={handleSendCode} class="mx-auto max-w-md mt-8 w-full">
            <input
              type="email"
              name="email"
              id="email"
              required
              value={email}
              readOnly
              class="border-2 border-slate-600 px-3  py-2 w-full rounded-md"
              placeholder="Enter Email"
            />
            <button
              type="submit"
              disabled={loading()}
              class="rounded-md my-4 flex items-center justify-center gap-1 bg-red-700  disabled:bg-red-600/60 px-5 py-3 w-full text-white"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!loading()}>Send Deletion Code</Show>
            </button>
          </form>
        </>
      ) : (
        <>
          <form
            onSubmit={handleVerifyCode}
            class="mx-auto max-w-md mt-8 w-full"
          >
            <label for="enteredCode" class="block text-gray-600">
              Enter Code
            </label>
            <input
              placeholder="Enter Code"
              type="text"
              name="enteredCode"
              id="enteredCode"
              class="border-2 border-slate-600 px-3  py-2 w-full rounded-md"
              required
            />

            <label class="block mt-4 text-gray-600" for="confirmationText">
              Type "delete my account" to confirm:
            </label>
            <input
              placeholder="delete my account"
              id="confirmationText"
              type="text"
              name="confirmationText"
              class="border-2 border-slate-600 px-3  py-2 w-full rounded-md"
              required
            />

            <button
              disabled={loading()}
              class="rounded-md my-4 flex items-center justify-center gap-1 bg-red-700  disabled:bg-red-600/60 px-5 py-3 w-full text-white"
            >
              <Show when={loading()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!loading()}>Delete Account</Show>
            </button>
          </form>

          <div class="flex items-center justify-center w-full">
            {msg() && (
              <p
                class={`${
                  success() ? "bg-green-600" : "bg-red-600"
                } my-5 rounded-md w-fit px-3 py-2 text-white`}
              >
                {msg()}
              </p>
            )}
          </div>

          <button onClick={() => setCodeSent(false)}>
            Didn't receive the code? Retry
          </button>
        </>
      )}
    </div>
  );
};
