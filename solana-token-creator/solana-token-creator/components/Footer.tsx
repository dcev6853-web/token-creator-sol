export default function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10">
      <div className="rounded-3xl bg-brand-light/60 p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span> Coin Factory
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Simple, fast and convenient token generator. Deploy SPL tokens in only 5 minutes.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Token Generator</p>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li><a href="/" className="hover:text-brand">Create SPL token on Solana</a></li>
              <li><a href="#tools" className="hover:text-brand">Solana multisender</a></li>
              <li><a href="#tools" className="hover:text-brand">Token profile page</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Company</p>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li><a href="#faq" className="hover:text-brand">Docs</a></li>
              <li><a href="#faq" className="hover:text-brand">Blog</a></li>
              <li><a href="mailto:support@example.com" className="hover:text-brand">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 border-t border-brand/10 pt-4 text-xs text-gray-500">
          <a href="#">Affiliate</a><a href="#">Privacy Policy</a><a href="#">Terms of Service</a>
          <span className="ml-auto">© 2026 Coin Factory. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
