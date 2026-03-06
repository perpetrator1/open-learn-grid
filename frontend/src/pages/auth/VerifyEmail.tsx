import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    api
      .get(`/api/auth/verify-email/${token}/`)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ?? "Verification failed. The link may have expired."
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center bg-white shadow rounded-lg p-8 space-y-4">
        {status === "loading" && (
          <p className="text-gray-600">Verifying your email…</p>
        )}
        {status === "success" && (
          <>
            <div className="text-green-600 text-4xl">✓</div>
            <h2 className="text-xl font-bold text-gray-900">Email verified!</h2>
            <p className="text-gray-600">{message}</p>
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-red-500 text-4xl">✗</div>
            <h2 className="text-xl font-bold text-gray-900">Verification failed</h2>
            <p className="text-gray-600">{message}</p>
            <Button variant="outline" asChild>
              <Link to="/login">Back to sign in</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
