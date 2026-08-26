import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <img src="/images/logo-marys-kitchen.png" alt="Mary's Kitchen" />
        <p className="eyebrow">Área reservada</p>
        <h1>Gestão semanal</h1>
        <p>Introduz a palavra-passe de administração para continuar.</p>
        {error === "invalid" && <p className="submit-error">Palavra-passe incorreta.</p>}
        {error === "setup" && <p className="submit-error">O acesso ainda não foi ativado nesta versão de teste.</p>}
        <form action="/api/admin/login" method="post">
          <label>Palavra-passe<input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit">Entrar</button>
        </form>
        <Link href="/">← Voltar ao site</Link>
      </section>
    </main>
  );
}
