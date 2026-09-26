import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Video } from "lucide-react";
import { logInAction } from "@/app/actions/connection/logInAction";

export default async function Connexion({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    return (
        <main className="studio-page signup-page">
            <div className="page-frame">
                <header className="brand-header signup-header">
                    <Link className="brand-lockup" href="/" aria-label="MirrorTalk, accueil">
                        <span className="brand-symbol"><Video size={20} strokeWidth={2.2} /></span>
                        <span className="brand-name">MirrorTalk</span>
                    </Link>
                </header>

                <section className="signup-layout" aria-labelledby="login-title">
                    <div className="signup-intro">
                        <h1 id="login-title">Retrouvez votre espace MirrorTalk.</h1>
                        <p>Connectez-vous pour reprendre votre préparation et retrouver vos sessions.</p>
                        <Link className="signup-back" href="/">
                            <ArrowLeft size={16} /> Retour à l&apos;accueil
                        </Link>
                    </div>

                    <div className="signup-panel">
                        <div className="signup-panel-heading">
                            <h2>Se connecter</h2>
                            <p>Utilisez l&apos;adresse e-mail et le mot de passe de votre compte.</p>
                        </div>

                        {error === "true" && (
                            <div className="notice notice-error" role="alert">
                                <strong>Connexion impossible</strong>
                                <p>Vérifiez votre adresse e-mail et votre mot de passe, puis réessayez.</p>
                            </div>
                        )}

                        <form action={logInAction} className="signup-form">
                            <div className="signup-field">
                                <label htmlFor="login-email">Adresse e-mail</label>
                                <div className="signup-input-wrap">
                                    <Mail size={18} aria-hidden="true" />
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="vous@exemple.fr"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="signup-field">
                                <label htmlFor="login-password">Mot de passe</label>
                                <div className="signup-input-wrap">
                                    <LockKeyhole size={18} aria-hidden="true" />
                                    <input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="signup-submit">
                                <span>Se connecter</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <p className="signup-existing">
                            Vous n&apos;avez pas encore de compte ? <Link href="/signup">Créer un compte.</Link>
                        </p>
                    </div>
                </section>

                <footer className="entry-footer signup-footer">
                    <span>Une salle commune, un échange en direct.</span>
                    <span>MirrorTalk</span>
                </footer>
            </div>
        </main>
    );
}