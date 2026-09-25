import SiteHeader from "../components/site-header";
import Verifier from "./verifier";

export default function VerifyPage() {
  return (
    <>
      <SiteHeader active="verify" />
      <main className="mx-auto max-w-3xl px-8 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-800">Verify a receipt</h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-500">
          Paste a receipt from the demo. Custos recomputes the canonical JSON of the receipt
          without its signature and checks the Ed25519 signature against the public key at{" "}
          <code className="font-mono text-xs text-navy-700">/api/public-key</code>. Nothing about
          the resident is needed to check it.
        </p>
        <div className="mt-8">
          <Verifier />
        </div>
      </main>
    </>
  );
}
