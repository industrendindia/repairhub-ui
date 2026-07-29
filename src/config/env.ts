const getEnv = (key: string, fallback = "") => {
  const value = import.meta.env[key] as string | undefined;
  return value?.trim() || fallback;
};

export const env = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "http://localhost:8080/api"),
  appName: getEnv("VITE_APP_NAME", "RepairHub"),
};
