import { Fact } from "@/components/audit/Fact";
import { Container, Stamp, StatTile } from "@/components/audit/ui";
import { audit } from "@/lib/content";
import { TLink } from "@/lib/mode";
import HeroCanvas from "./HeroCanvas";

/**
 * The overview's one cinematic moment. The words are server-rendered and paint
 * first; the canvas behind them loads after, and only on this page.
 */
export default function Hero() {
  const { company, role, hero } = audit.config;
  const c = audit.company;
  return (
    <section className="relative isolate -mt-[100px] overflow-hidden pt-[100px] xl:-mt-14 xl:pt-14">
      <div className="no-print absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent_96%)]" aria-hidden>
        {/* Painted with the HTML, so the first frame already has its light; the canvas fades in over it. */}
        <div className="absolute inset-0 [background:radial-gradient(60%_70%_at_86%_38%,color-mix(in_oklab,var(--live)_34%,transparent),transparent_70%),radial-gradient(40%_50%_at_70%_80%,color-mix(in_oklab,var(--live)_16%,transparent),transparent_70%)]" />
        <HeroCanvas variant={hero.variant} />
        {/* Keep the left calm for the headline, and fade into the page below. */}
        <div className="absolute inset-0 bg-gradient-to-r from-page via-page/70 to-transparent lg:via-page/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-page to-transparent" />
      </div>

      <Container wide className="relative flex min-h-[min(86svh,860px)] flex-col justify-center pt-10 pb-12 sm:pt-16">
        <div className="max-w-[46rem]">
          <div className="u-rise mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] text-ink-2 backdrop-blur">
            <span className="size-1.5 rounded-full bg-live" aria-hidden />
            Prepared for the {role.title} conversation
          </div>
          <h1 className="u-display u-rise text-[52px] leading-[0.98] text-ink sm:text-[76px] lg:text-[92px]">
            {company.name},
            <br />
            <em className="text-live-ink italic">read from the outside.</em>
          </h1>
          <div className="u-rise mt-7 max-w-[60ch] space-y-3 text-[16.5px] leading-[1.6] text-ink-2 sm:text-[17.5px]">
            <Fact fact={c.oneLiner} as="p" />
            <Fact fact={c.model} as="p" />
          </div>
          <div className="no-print u-rise mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#thesis"
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-page transition-transform hover:scale-[1.02]"
            >
              The two-minute version
            </a>
            {audit.config.modules.workflows && (
              <TLink href="/workflows" className="rounded-full border border-line-strong bg-surface/60 px-5 py-2.5 text-[14px] text-ink backdrop-blur transition-colors hover:border-ink-3">
                How the work flows
              </TLink>
            )}
          </div>
        </div>

        <div className="u-rise mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line lg:mt-20 lg:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.value + s.text} className="bg-surface/85 p-5 backdrop-blur-md sm:p-6">
              <StatTile stat={s} />
            </div>
          ))}
        </div>

        <Stamp className="mt-5" extra={hero.variant === "flywheel" && hero.orbits ? <span className="u-label hidden lg:inline">Orbits: {hero.orbits.join(" · ")}</span> : undefined} />
      </Container>
    </section>
  );
}
