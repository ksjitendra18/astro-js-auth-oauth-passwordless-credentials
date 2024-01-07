import { parse, safeParse } from "valibot";
import SignupSchema from "../validations/signup";
import { Show, createSignal } from "solid-js";

const SignupForm = () => {
  const [validationIssue, setValidationIssue] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);

  const handleSignup = async (e) => {
    setValidationIssue("");
    setLoading(true);
    e.preventDefault();

    const formData = new FormData(e.target);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const safeParsedData = safeParse(SignupSchema, { name, email, password });

      if (safeParsedData.issues) {
        setValidationIssue(safeParsedData.issues[0].message);
        return;
      }

      console.log(safeParsedData.output);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div class="flex items-center justify-between">
        <form
          onSubmit={handleSignup}
          method="post"
          class="w-[100%] mx-auto md:w-auto"
        >
          <label for="name" class="block text-gray-600">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            class="border-slate-600 px-3 w-full md:w-[400px] py-2 rounded-md border-2"
          />
          <label for="email" class="mt-5 block text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class="border-slate-600 px-3 w-full md:w-[400px] py-2 rounded-md border-2"
          />
          <label for="password" class="mt-5 block text-gray-600">
            Password
          </label>
          <div class="relative">
            <input
              type="password"
              name="password"
              id="password"
              required
              class="border-slate-600 px-3 w-full md:w-[400px] py-2 rounded-md border-2"
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

          <Show when={validationIssue()}>
            <div class="my-5 bg-red-500 text-white rounded-md px-3 py-2">
              {validationIssue()}
            </div>
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
