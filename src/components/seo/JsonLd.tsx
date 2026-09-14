type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

/** Safely emits server-rendered structured data without adding client JavaScript. */
export default function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
