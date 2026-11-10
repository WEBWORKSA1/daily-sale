// Mandatory top bar on every page. The destination URL lives only in the href,
// never in visible text.
export function SponsorshipBar() {
  return (
    <div className="bg-ink text-paper">
      <a
        href="https://web.works/contact"
        target="_blank"
        rel="noopener"
        className="block w-full text-center py-2 px-4 text-xs md:text-sm tracking-[0.06em] hover:bg-cart transition-colors"
      >
        <span className="font-bold">Contact</span>
        <span className="opacity-80">, if you are interested in this </span>
        <span className="font-bold">Website / Domain Name / Sponsorship / Advertisement / Partnership</span>
        <span aria-hidden="true"> →</span>
      </a>
    </div>
  );
}
