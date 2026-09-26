import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { SignUpForm } from "@/app/components/connectionForms/SignUpForm";

export default async function Inscription() {
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
                        <SignUpForm />
                        <p className="signup-existing">
                            Vous avez déjà un compte ? <span>Connectez-vous depuis le bouton en haut de page.</span>
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
