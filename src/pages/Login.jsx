import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { session } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const navigate = useNavigate();

    if (session) {
        return <Navigate to="/queue" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            navigate("/queue");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">

                <h2 className="mb-2 text-3xl font-bold text-white text-center tracking-wide">
                    Lumina
                </h2>
                <p className="text-zinc-400 text-sm text-center mb-8 uppercase tracking-widest">
                    Editorial Gateway
                </p>

                {errorMsg && (
                    <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500 text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Identity (Email)"
                        value={email}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 text-white p-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Passkey"
                        value={password}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 text-white p-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        disabled={loading}
                        className="mt-4 w-full rounded-lg bg-white p-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Enter Environment"}
                    </button>
                </form>
            </div>
        </div>
    );
}