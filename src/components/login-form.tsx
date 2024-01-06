import { parse, safeParse } from "valibot";
import LoginSchema from "../validations/login";
import { Show, createSignal } from "solid-js";

const LoginForm = () => {
  const [validationIssue, setValidationIssue] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const handleLogin = async (e) => {
    setValidationIssue("");
    setLoading(true);
    e.preventDefault();

    const formData = new FormData(e.target);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const safeParsedData = safeParse(LoginSchema, { name, email, password });

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
          onSubmit={handleLogin}
          method="post"
          class="w-[100%] mx-auto md:w-auto"
        >
          <label for="email" class="mt-5 block text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            class="border-slate-400 px-3 w-full md:w-[400px] py-2 rounded-md border-2"
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
              class="border-slate-400 px-3 w-full md:w-[400px] py-2 rounded-md border-2"
            />
            <button type="button" aria-label="Password Invisible.">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 select-none text-gray-700 cursor-pointer h-6 absolute top-2 right-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                ></path>
              </svg>
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

export default LoginForm;
