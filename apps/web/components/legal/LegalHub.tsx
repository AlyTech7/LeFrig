'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LegalBlock, LegalDocument } from '@/lib/legal-content';
import { LEGAL_META, LEGAL_QUICK_LINKS } from '@/lib/legal-content';
import { useLocale, useT } from '@/lib/locale';

function BlockRenderer({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="legal-p">{block.text}</p>;
    case 'h3':
      return <h3 className="legal-h3">{block.text}</h3>;
    case 'ul':
      return (
        <ul className="legal-list">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="legal-list legal-list--ol">
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <figure className="legal-table-wrap">
          {block.caption && <figcaption className="legal-table-caption">{block.caption}</figcaption>}
          <div className="legal-table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  {block.headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join('-').slice(0, 48)}>
                    {row.map((cell) => (
                      <td key={cell.slice(0, 32)}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
    case 'note':
      return (
        <aside className="legal-note" role="note">
          {block.title && <strong>{block.title}</strong>}
          <p>{block.text}</p>
        </aside>
      );
    default:
      return null;
  }
}

function DocumentSection({ doc }: { doc: LegalDocument }) {
  const t = useT();
  const { locale } = useLocale();
  const title = locale === 'ar' && doc.titleAr ? doc.titleAr : doc.title;

  return (
    <article id={doc.id} className="legal-doc">
      <header className="legal-doc__head">
        <p className="legal-doc__kicker">{t('legal.document')}</p>
        <h2 className="legal-doc__title">{title}</h2>
        <p className="legal-doc__summary">{doc.summary}</p>
      </header>
      <div className="legal-doc__body">
        {doc.blocks.map((block, i) => (
          <BlockRenderer key={`${doc.id}-${i}`} block={block} />
        ))}
      </div>
    </article>
  );
}

type Props = {
  documents: LegalDocument[];
};

export function LegalHub({ documents }: Props) {
  const t = useT();
  const [activeId, setActiveId] = useState<string>(documents[0]?.id ?? '');

  useEffect(() => {
    const ids = documents.map((d) => d.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [documents]);

  return (
    <div className="legal-hub">
      <aside className="legal-sidebar" aria-label={t('legal.indexAria')}>
        <div className="legal-sidebar__sticky">
          <p className="legal-sidebar__label">{t('legal.index')}</p>
          <nav className="legal-sidebar__nav">
            {LEGAL_QUICK_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className={`legal-sidebar__link ${activeId === link.id ? 'legal-sidebar__link--active' : ''}`}
              >
                {link.title}
              </a>
            ))}
          </nav>

          <div className="legal-sidebar__meta">
            <p>
              <span>{t('legal.updated')}</span>
              <time dateTime={LEGAL_META.lastUpdatedIso}>{LEGAL_META.lastUpdated}</time>
            </p>
            <p>
              <span>{t('legal.contact')}</span>
              <Link href={`mailto:${LEGAL_META.contactEmail}`}>{LEGAL_META.contactEmail}</Link>
            </p>
            <p>
              <span>{t('legal.privacy')}</span>
              <Link href={`mailto:${LEGAL_META.dpoEmail}`}>{LEGAL_META.dpoEmail}</Link>
            </p>
          </div>

          <a href="#legal-top" className="legal-sidebar__top">
            {t('legal.backToTop')}
          </a>
        </div>
      </aside>

      <div className="legal-main">
        <div className="legal-intro" id="legal-top">
          <p>
            {t('legal.intro', {
              platform: LEGAL_META.platformName,
              tagline: LEGAL_META.platformTagline,
            })}
          </p>
          <aside className="legal-disclaimer" role="note">
            <strong>{t('legal.disclaimerTitle')}</strong> {t('legal.disclaimer')}
          </aside>
        </div>

        {documents.map((doc) => (
          <DocumentSection key={doc.id} doc={doc} />
        ))}

        <footer className="legal-contact">
          <h2 className="legal-contact__title">{t('legal.contactTitle')}</h2>
          <p>
            {t('legal.contactGeneral')}{' '}
            <Link href={`mailto:${LEGAL_META.contactEmail}`}>{LEGAL_META.contactEmail}</Link>
          </p>
          <p>
            {t('legal.contactPrivacy')}{' '}
            <Link href={`mailto:${LEGAL_META.dpoEmail}`}>{LEGAL_META.dpoEmail}</Link>
          </p>
          <p className="legal-contact__foot">
            {t('legal.lastReview')} {LEGAL_META.lastUpdated} · {LEGAL_META.platformName}
          </p>
        </footer>
      </div>
    </div>
  );
}
