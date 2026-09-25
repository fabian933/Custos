import SiteHeader from "../components/site-header";
import Verifier from "./verifier";

export default function VerifyPage() {
  return (
    <>
      <SiteHeader active="verify" />
      <main className="mx-auto max-w-3xl px-8 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-800">
          Check an answer is genuine, without seeing the data behind it.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-500">
          Every answer from Custos is signed. Paste one here to confirm it came from Custos and
          hasn&apos;t been changed. The signature is checked against the public key at{" "}
          <code className="font-mono text-xs text-navy-700">/api/public-key</code>; nothing about
          the resident is needed.
        </p>
        <div className="mt-8">
          <Verifier />
        </div>
      </main>
    </>
  );
}
