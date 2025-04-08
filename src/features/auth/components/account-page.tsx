import EmailIcon from "lucide-solid/icons/mail";
import ShieldCheckIcon from "lucide-solid/icons/shield-check";
import SaveIcon from "lucide-solid/icons/save";
import KeyRoundIcon from "lucide-solid/icons/key-round";
import LockOpenIcon from "lucide-solid/icons/lock-keyhole";
import Loader2 from "lucide-solid/icons/loader-2";
import BanIcon from "lucide-solid/icons/ban";

import { createSignal, Show } from "solid-js";
import type { UserAccountInfo } from "../services/user";

interface AccountPageProps {
  userAccountInfo: UserAccountInfo;
  currentSessionId: string;
}

const strategiesMap = {
  github: "GitHub",
  google: "Google",
  password: "Password",
  magic_link: "Magic Link",
};

export const AccountPage = ({
  currentSessionId,
  userAccountInfo,
}: AccountPageProps) => {
  const { fullName, email, oauthProviders, loginLogs, passwords } =
    userAccountInfo;

  const isPasswordLogin = !!passwords;

  const logs = loginLogs.sort((a) =>
    a.sessionId === currentSessionId ? -1 : 1
  );
  function capitalizeFirstWord(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  const formatDate = (date: string) => {
    const utcDate = new Date(`${date}Z`);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(utcDate));
  };

  const [revokingSession, setRevokingSession] = createSignal(false);

  const revokeSession = async (sessionId: string) => {
    try {
      setRevokingSession(true);
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (res.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRevokingSession(false);
    }
  };

  const [savingUserName, setSavingUserName] = createSignal(false);

  const [newName, setNewName] = createSignal(fullName ?? "");

  const saveUserName = async () => {
    try {
      setSavingUserName(true);
      const res = await fetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({ fullName: newName() }),
      });

      if (res.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingUserName(false);
    }
  };

  const [revokingAllSessions, setRevokingAllSessions] = createSignal(false);

  const revokeAllSessions = async () => {
    try {
      setRevokingAllSessions(true);
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
      });

      if (res.status === 200) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRevokingAllSessions(false);
    }
  };

  return (
    <div class="  w-full py-5 space-y-8  mx-auto">
      <h1 class="text-3xl font-bold text-center">Account Settings</h1>

      <section class="border-2 rounded-md p-6">
        <h2 class="text-xl text-center md:text-left md:text-2xl font-semibold">
          Profile Information
        </h2>

        <div class="mt-5">
          <label for="name">Name</label>
          <div class="flex flex-col md:flex-row gap-4">
            <input
              id="name"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
              class="border-slate-600 px-3 md:w-1/2 py-2 rounded-md border-2"
            />
            <button
              disabled={savingUserName()}
              onClick={saveUserName}
              class="bg-black  disabled:bg-black/60   flex items-center justify-center  px-10 py-2 w-full md:w-fit text-center rounded-md text-white "
            >
              <Show when={savingUserName()}>
                <Loader2 class="animate-spin mx-auto" />
              </Show>
              <Show when={!savingUserName()}>
                <SaveIcon class="size-4 mr-2" />
                Save
              </Show>
            </button>
          </div>
        </div>

        <div class="space-y-2 mt-5">
          <p>Email</p>
          <div class="flex flex-col md:flex-row items-center gap-5">
            <p>{email}</p>
            <a
              class="border-2 border-black px-3 py-2 rounded-md flex items-center text-sm gap-3 "
              href="/account/update/email"
            >
              <EmailIcon class="size-5" />
              Change Email
            </a>
          </div>
        </div>
      </section>

      {isPasswordLogin && (
        <section class="border-2 rounded-md p-6">
          <h2 class="text-2xl font-semibold">Security</h2>

          <a
            href="/account/update/password"
            class="bg-black my-5  disabled:bg-black/60   flex items-center justify-center  px-10 py-3 w-full md:w-fit text-center rounded-md text-white "
          >
            <KeyRoundIcon class="size-5 mr-2" />
            Change Password
          </a>
        </section>
      )}

      {oauthProviders.length > 0 && (
        <section class="border-2 rounded-md p-6">
          <div class="flex flex-col space-y-1.5 ">
            <h2 class="text-2xl font-semibold">Connected Accounts</h2>
          </div>

          <div class="flex flex-col md:flex-row gap-5 items-center my-5">
            {oauthProviders.map((provider) => (
              <div class="flex rounded-md px-4 py-3 border border-gray-400 items-center gap-2">
                <div class="flex items-center gap-3">
                  {provider.strategy === "google" ? (
                    <img src="/google.svg" width="32px" alt="" />
                  ) : (
                    <img src="/github-mark.svg" width="32px" alt="" />
                  )}
                  <p>{strategiesMap[provider.strategy]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section class="border-2 rounded-md p-6">
        <div class="flex gap-3 items-center ">
          <h2 class="text-2xl font-semibold">Two Factor</h2>
          {userAccountInfo.twoFactorEnabled ? (
            <p class="text-sm uppercase bg-green-600 px-4 py-2 text-white rounded-full">
              Enabled
            </p>
          ) : (
            <p class="text-sm uppercase bg-gray-400 px-4  py-2 text-white rounded-full">
              Disabled
            </p>
          )}
        </div>
        {userAccountInfo.twoFactorEnabled ? (
          <>
            <div class="flex flex-col md:flex-row gap-5 mt-5 items-center">
              <a
                href="/two-factor"
                class="bg-black  w-fit flex items-center justify-center px-10 py-3  md:w-fit text-center rounded-md text-white "
              >
                <ShieldCheckIcon class="size-5 mr-2" />
                Reconfigure
              </a>
              <a
                href="/two-factor/disable"
                class="bg-red-700   w-fit flex items-center justify-center px-10 py-3  md:w-fit text-center rounded-md text-white "
              >
                <BanIcon class="size-5 mr-2" />
                Disable
              </a>
            </div>

            <div class="my-5 mt-10">
              <h3 class="mb-2 text-2xl font-semibold">Recovery Codes</h3>
              <a
                href="/recovery-codes"
                class="border-2 border-black w-fit px-10 py-3 rounded-md flex items-center justify-center gap-2"
              >
                <LockOpenIcon class="size-5 mr-2" />
                Recovery Codes
              </a>
            </div>
          </>
        ) : (
          <a
            href="/two-factor"
            class="bg-black  my-5 disabled:bg-black/60   flex items-center justify-center  px-10 py-2 w-full md:w-fit text-center rounded-md text-white "
          >
            Enable
          </a>
        )}
      </section>
      <section class="border-2 rounded-md p-6">
        <div class="flex items-center gap-5 space-y-1.5 ">
          <h2 class="text-2xl font-semibold">
            Logs ({logs.length > 0 && `${logs.length} Active Sessions`})
          </h2>

          {logs.length > 1 && (
            <button
              disabled={revokingAllSessions()}
              onClick={revokeAllSessions}
              class="px-3 py-2 rounded-md bg-red-700 text-white"
            >
              {revokingAllSessions() ? (
                <Loader2 class="animate-spin mx-auto" />
              ) : (
                "Revoke All Sessions"
              )}
            </button>
          )}
        </div>

        <div class="hidden my-4 md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Device
                </th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Method
                </th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  IP
                </th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Login Time
                </th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span>{`${log.os || ""} ${capitalizeFirstWord(
                        log.device
                      )} ${log.browser || ""}`}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    {strategiesMap[log.strategy]}
                  </td>
                  <td class="px-4 py-4 text-sm font-mono">{log.ip}</td>
                  <td class="px-4 py-4 text-sm">
                    <span>
                      {log.createdAt.toLocaleDateString() +
                        " " +
                        log.createdAt.toLocaleTimeString()}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-sm">
                    {currentSessionId !== log.sessionId ? (
                      <button
                        disabled={revokingSession()}
                        onClick={() => revokeSession(log.sessionId!)}
                        class="bg-red-700 text-white px-6 py-2 rounded-md font-medium"
                      >
                        {revokingSession() ? (
                          <Loader2 class="animate-spin mx-auto" />
                        ) : (
                          "Revoke Access"
                        )}
                      </button>
                    ) : (
                      <span class="text-green-600 bg-green-100 px-4 py-2 rounded-full font-medium">
                        This Device
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="md:hidden my-4 space-y-4">
          {logs.map((log) => (
            <div class="bg-white rounded-lg border p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{`${
                    log.os || ""
                  } ${capitalizeFirstWord(log.device)}`}</span>
                </div>
                {currentSessionId === log.sessionId && (
                  <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    This Device
                  </span>
                )}
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Browser</span>
                  <span>{log.browser || "-"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Method</span>
                  <span>{strategiesMap[log.strategy] || log.strategy}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">IP Address</span>
                  <span class="font-mono">{log.ip || "-"}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Login Time</span>
                  {log.createdAt.toLocaleDateString() +
                    " " +
                    log.createdAt.toLocaleTimeString()}
                </div>
              </div>

              {currentSessionId !== log.sessionId && (
                <button
                  disabled={revokingSession()}
                  onClick={() => revokeSession(log.sessionId!)}
                  class="w-full mt-2 text-red-500 hover:text-red-700 text-sm font-medium py-2 border border-red-500 rounded-md"
                >
                  {revokingSession() ? (
                    <Loader2 class="animate-spin mx-auto" />
                  ) : (
                    "Revoke Access"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section class="border-2 border-rose-700 rounded-md p-6">
        <div class="flex flex-col space-y-1.5 ">
          <h2 class="text-2xl font-semibold">Delete Account</h2>
          <p>
            Please note that this action is irreversible. Once you delete your
            account, there is no going back.
          </p>
        </div>

        <div class="flex flex-col md:flex-row gap-5 items-center my-5">
          <a
            href="/account/delete"
            class="bg-red-700   w-fit flex items-center justify-center px-10 py-3  md:w-fit text-center rounded-md text-white "
          >
            Delete Account
          </a>
        </div>
      </section>
    </div>
  );
};
