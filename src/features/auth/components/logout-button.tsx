export const LogoutButton = () => {
  const handleLogout = async () => {
    await fetch(`/api/auth/logout`, {
      method: "POST",
    });

    window.location.href = "/";
  };

  return (
    <button class="cursor-pointer" onClick={handleLogout}>
      Logout
    </button>
  );
};
