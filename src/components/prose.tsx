import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Lesson bodies are authored as markdown in the course builder. Raw HTML is
 * not enabled, so admin-authored content cannot inject scripts.
 */
export function Prose({ children }: { children: string }) {
  return (
    <div className="prose-tc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h2 className="mt-7 text-xl font-semibold text-[var(--brand-ink)]" {...p} />,
          h2: (p) => <h3 className="mt-7 text-lg font-semibold text-[var(--brand-ink)]" {...p} />,
          h3: (p) => <h4 className="mt-6 text-[15px] font-semibold text-[var(--brand-ink)]" {...p} />,
          p: (p) => <p className="mt-3.5 text-[15px] leading-[1.75] text-[var(--brand-charcoal)]" {...p} />,
          ul: (p) => <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[15px] leading-[1.7] text-[var(--brand-charcoal)]" {...p} />,
          ol: (p) => <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-[15px] leading-[1.7] text-[var(--brand-charcoal)]" {...p} />,
          li: (p) => <li className="ps-1" {...p} />,
          strong: (p) => <strong className="font-semibold text-[var(--brand-ink)]" {...p} />,
          blockquote: (p) => (
            <blockquote
              className="mt-4 rounded-e-[var(--radius-control)] border-s-[3px] border-[var(--brand-red)] bg-[var(--brand-canvas)] px-4 py-3 text-[14.5px] italic leading-[1.7] text-[var(--brand-charcoal)]"
              {...p}
            />
          ),
          code: (p) => (
            <code
              className="rounded bg-[var(--brand-canvas)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--brand-ink)]"
              {...p}
            />
          ),
          a: (p) => (
            <a
              className="font-medium text-[var(--brand-red)] underline underline-offset-4"
              target="_blank"
              rel="noreferrer noopener"
              {...p}
            />
          ),
          table: (p) => (
            <div className="mt-4 overflow-x-auto">
              <table className="data-table" {...p} />
            </div>
          ),
          hr: () => <hr className="my-6 border-[var(--brand-line)]" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
