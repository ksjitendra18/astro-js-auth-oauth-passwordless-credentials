import { Show, createSignal, type JSX } from "solid-js";
import { z } from "zod";
import SignupSchema from "../validations/signup";

const SignupForm = () => {
  const [validationIssue, setValidationIssue] =
    createSignal<z.ZodFormattedError<
      z.infer<typeof SignupSchema>,
      string
    > | null>(null);

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);

  const handleSignup: JSX.EventHandlerUnion<
    HTMLFormElement,
    SubmitEvent
  > = async (e) => {
    e.preventDefault();

    setValidationIssue(null);
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      // const safeParsedData = SignupSchema.safeParse({ name, email, password });

      // if (!safeParsedData.success) {
      //   setValidationIssue(safeParsedData.error.format());
      //   return;
      // }

      const safeParsedData = {
        data: {
          name,
          email,
          password,
        },
      };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(safeParsedData.data),
      });

      const resData = await res.json();

      if (res.status === 201) {
        return window.location.replace(`/verify/${resData.data.id}`);
      } else {
        if (resData && resData.error === "validation_error") {
          setValidationIssue(resData.message);
        }
        setError(resData.message);
      }
    } catch (error) {
      setError("Error while Signup. Please try again later");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div class="flex w-full max-w-[400px] items-center justify-between">
        <form onSubmit={handleSignup} method="post" class="w-[100%] mx-auto">
          <label for="name" class="block text-gray-600">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            class="border-slate-600 px-3 w-full py-2 rounded-md border-2"
          />

          <Show when={validationIssue()?.name}>
            <div class="flex flex-col gap-3">
              {validationIssue()?.name?._errors?.map((err) => (
                <p class="my-5  bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <label
            for="email"
            class={`${error() ? "text-red-600" : "text-gray-600"}  mt-5 block `}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class={`${
              validationIssue()?.email ? "border-red-600" : "border-slate-600"
            } px-3 w-full  py-2 rounded-md border-2`}
          />

          <Show when={validationIssue()?.email}>
            <div class="flex flex-col gap-3">
              {validationIssue()?.email?._errors?.map((err) => (
                <p class="my-5 bg-red-500  text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <label for="password" class="mt-5 block text-gray-600">
            Password
          </label>
          <div class="relative">
            <input
              type={showPassword() ? "text" : "password"}
              name="password"
              id="password"
              required
              class={`${
                validationIssue()?.password
                  ? "border-red-600"
                  : "border-slate-600"
              }  px-3 w-full  py-2 rounded-md border-2`}
            />
            <button
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
              aria-label="Password Invisible."
            >
              {showPassword() ? (
                <img
                  src="/eye-icon.svg"
                  class="w-6 select-none text-gray-700 cursor-pointer h-6 absolute top-2 right-2"
                  width="20px"
                />
              ) : (
                <img
                  src="/eye-close.svg"
                  class="w-6 select-none text-gray-700 cursor-pointer h-6 absolute top-2 right-2"
                  width="20px"
                />
              )}
            </button>
          </div>
          <Show when={validationIssue()?.password}>
            <div class="flex flex-col ">
              {validationIssue()?.password?._errors?.map((err) => (
                <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
                  {err}
                </p>
              ))}
            </div>
          </Show>

          <Show when={error()}>
            <p class="mt-2 bg-red-500 text-white rounded-md px-3 py-2">
              {error()}
            </p>
          </Show>
          <div class="flex justify-end">
            <button
              type="submit"
              class="bg-black mt-5 flex items-center justify-center w-full px-10 py-2 text-center rounded-md text-white hover:scale-95 duration-100 ease-in"
            >
              <Show when={loading()}>
                <img src="/spinner.svg" class="animate-spin fill-white mr-2" />{" "}
                Signing up...
              </Show>
              <Show when={!loading()}>Sign up</Show>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default SignupForm;
