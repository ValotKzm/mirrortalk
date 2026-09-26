import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { SignUpForm } from "@/app/components/connectionForms/SignUpForm";

export default async function Inscription({
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

                <section className="signup-layout" aria-labelledby="signup-title">
                    <div className="signup-intro">
                        <h1 id="signup-title">Votre prochaine étape commence ici.</h1>
                        <p>Créez votre compte pour retrouver votre espace MirrorTalk.</p>
                        <Link className="signup-back" href="/">
                            <ArrowLeft size={16} /> Retour à l&apos;accueil
                        </Link>
                    </div>

                    <div className="signup-panel">
                        <div className="signup-panel-heading">
                            <h2>Créer un compte</h2>
                            <p>Quelques informations et vous pourrez commencer.</p>
                        </div>
                        {error === "password-too-short" ? (
                            <div className="notice notice-error" role="alert">
                                <strong>Mot de passe trop court</strong>
                                <p>Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
                            </div>
                        ) : error === "true" ? (
                            <div className="notice notice-error" role="alert">
                                <strong>Création du compte impossible</strong>
                                <p>Vérifiez les informations saisies ou essayez une autre adresse e-mail.</p>
                            </div>
                        ) : null}
                        <SignUpForm />
                        <p className="signup-existing">
                            Vous avez déjà un compte ? <Link href="/login">Connectez-vous.</Link>
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
