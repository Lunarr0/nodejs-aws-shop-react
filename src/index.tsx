import React from "react";
import { createRoot } from "react-dom/client";
import App from "~/components/App/App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { theme } from "~/theme";
import { Alert, Snackbar } from "@mui/material";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
      onError: (error: any) => {
        if (error?.response?.status === 401) {
          // Handle unauthorized access
          window.dispatchEvent(
            new CustomEvent("app-error", {
              detail: {
                message: "You are not authorized. Please sign in.",
                severity: "error",
                status: 401,
              },
            })
          );
        } else if (error?.response?.status === 403) {
          // Handle forbidden access
          window.dispatchEvent(
            new CustomEvent("app-error", {
              detail: {
                message: "You don't have permission to access this resource.",
                severity: "error",
                status: 403,
              },
            })
          );
        }
      },
    },
    mutations: {
      onError: (error: any) => {
        if (error?.response?.status === 401) {
          window.dispatchEvent(
            new CustomEvent("app-error", {
              detail: {
                message: "You are not authorized. Please sign in.",
                severity: "error",
                status: 401,
              },
            })
          );
        } else if (error?.response?.status === 403) {
          window.dispatchEvent(
            new CustomEvent("app-error", {
              detail: {
                message: "You don't have permission to access this resource.",
                severity: "error",
                status: 403,
              },
            })
          );
        }
      },
    },
  },
});

// Error Alert Component
const ErrorAlert = () => {
  const [error, setError] = React.useState<{
    message: string;
    severity: "error" | "warning";
    open: boolean;
  }>({
    message: "",
    severity: "error",
    open: false,
  });

  React.useEffect(() => {
    const handleError = (event: CustomEvent) => {
      setError({
        message: event.detail.message,
        severity: event.detail.severity,
        open: true,
      });
    };

    window.addEventListener("app-error", handleError as EventListener);
    return () => {
      window.removeEventListener("app-error", handleError as EventListener);
    };
  }, []);

  const handleClose = () => {
    setError((prev) => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={error.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={error.severity}>
        {error.message}
      </Alert>
    </Snackbar>
  );
};

if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start({ onUnhandledRequest: "bypass" });
}

const container = document.getElementById("app");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
          <ErrorAlert />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
