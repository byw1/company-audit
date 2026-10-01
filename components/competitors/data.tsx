import { CompanyLogo } from "@/components/audit/CompanyLogo";
import { audit, describePosition } from "@/lib/content";
import type { MapPoint } from "./Explorer";

/** The positioning map's points: the company first, then the field. */
export function mapPoints(): MapPoint[] {
  const { self, field } = audit.competitors;
  return [
    {
      id: "self",
      name: audit.config.company.name,
      now: self.now,
      heading: self.heading,
      self: true,
      describe: `${describePosition(self.now)}; heading toward ${describePosition(self.heading)}`,
    },
    ...field.map((c) => ({
      id: c.id,
      name: c.name,
      now: c.now,
      heading: c.heading,
      threat: c.threat,
      describe: `${describePosition(c.now)}; heading toward ${describePosition(c.heading)}; threat ${c.threat}`,
    })),
  ];
}

export function logoNode(domain: string, name: string, size = 28) {
  return <CompanyLogo domain={domain} name={name} size={size} />;
}
