import { FiPhone, FiMail, FiFacebook, FiInstagram } from 'react-icons/fi';
import { PremiumLogo } from '@premiummg/ui';
import { useT } from '../lang';
import { MEDIA, PHONE, EMAIL } from '../palette';

// A page-owned footer shell, not @premiummg/ui's SiteFooter - that shared
// component's column grid is fixed at md:2/lg:4 with no count prop, and
// this footer only ever has 3 real columns (no newsletter signup), so the
// shared shell always left an empty gap at the widest breakpoint. Same
// reasoning as the local SectionHead: build the one piece that's actually
// page-specific locally instead of touching the shared package for a
// styling knob only this page needs.
function FooterColumn({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <p className="pmg-eyebrow text-white/40 mb-4">{label}</p>}
      {children}
    </div>
  );
}

// Two of Malcolm's fixes land here. The Riverview map is simply gone - one
// dojo, one address, one "get directions" link. And the affiliation band is
// new: nothing on the live site today says Otoshi is part of the Premium
// family.
export function Footer() {
  const t = useT();
  return (
    // id="contact": the navbar's "Contact Us" link scrolls here - this is
    // where the phone/email/hours/social links actually live, there's no
    // separate contact section on the page.
    <footer id="contact" className="bg-(--premium-black) text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        <FooterColumn>
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <img src={`${MEDIA}/logo.png`} alt="Judo Otoshi" className="h-28 w-28 object-contain" />
            <span className="block font-heading font-black text-white text-xl mt-3">Judo Otoshi</span>
            <p className="text-sm leading-relaxed mt-2">{t.hero.location}</p>
          </div>
        </FooterColumn>

        <FooterColumn label={t.contact.eyebrow}>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 hover:text-white transition">
                <FiPhone size={14} /> {PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-white transition">
                <FiMail size={14} /> {EMAIL}
              </a>
            </li>
          </ul>
          <p className="pmg-eyebrow text-white/40 mt-6 mb-2">{t.contact.hoursLabel}</p>
          <p className="text-sm">{t.contact.hours}</p>
          <p className="text-sm">{t.contact.hours2}</p>
          <p className="pmg-eyebrow text-white/40 mt-6 mb-2">{t.contact.followLabel}</p>
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=100039844673681" target="_blank" rel="noreferrer"
               aria-label="Facebook" className="w-8 h-8 rounded-lg grid place-items-center bg-white/10 hover:bg-white/20 transition">
              <FiFacebook size={14} />
            </a>
            <a href="https://www.instagram.com/clubdejudootoshi/" target="_blank" rel="noreferrer"
               aria-label="Instagram" className="w-8 h-8 rounded-lg grid place-items-center bg-white/10 hover:bg-white/20 transition">
              <FiInstagram size={14} />
            </a>
          </div>
        </FooterColumn>

        <FooterColumn label={t.footer.affiliation}>
          {/* mode="dark", not "auto" - this footer is a fixed dark surface
              regardless of the visitor's own theme choice, so the logo
              artwork should be pinned to the dark variant rather than
              watching html.dark (which tracks the PAGE's theme, not this
              section's fixed one). */}
          <a href="https://premiummg.ca/" target="_blank" rel="noreferrer" className="inline-block cursor-pointer hover:opacity-80 transition">
            <PremiumLogo variant="horizontal" mode="dark" size="sm" />
          </a>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <button className="hover:text-white/80 transition">{t.footer.terms}</button>
            <button className="hover:text-white/80 transition">{t.footer.privacy}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
