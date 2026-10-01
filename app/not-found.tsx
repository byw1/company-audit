import { Container } from "@/components/audit/ui";
import { TLink } from "@/lib/mode";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <div className="u-label mb-4">404</div>
      <h1 className="u-display text-[44px] text-ink sm:text-[56px]">Nothing here.</h1>
      <p className="u-prose mx-auto mt-4 max-w-[44ch] text-[15.5px]">That page doesn’t exist in this audit. The overview has everything else.</p>
      <TLink href="/" className="mt-8 inline-block rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page">
        Back to the overview
      </TLink>
    </Container>
  );
}
