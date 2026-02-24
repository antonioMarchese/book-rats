import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * /login — thin Server Component wrapper.
 * Reads `next` and `error` from the URL and passes them to the Client Component,
 * enabling post-auth deep-link redirects (e.g. from the invite page).
 */
export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return <LoginForm next={next} initialError={error} />;
}
