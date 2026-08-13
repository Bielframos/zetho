import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

type SeoPayload = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private document = inject(DOCUMENT);
  private title = inject(Title);
  private meta = inject(Meta);

  private get appUrl() {
    return environment.appUrl.endsWith('/')
      ? environment.appUrl
      : `${environment.appUrl}/`;
  }

  apply(payload: SeoPayload) {
    const title = payload.title?.trim();
    const description = payload.description?.trim();

    if (title) {
      this.title.setTitle(title);
      this.setMetaProperty('og:title', payload.ogTitle ?? title);
      this.setMetaName('twitter:title', payload.twitterTitle ?? title);
    }

    if (description) {
      this.setMetaName('description', description);
      this.setMetaProperty(
        'og:description',
        payload.ogDescription ?? description,
      );
      this.setMetaName(
        'twitter:description',
        payload.twitterDescription ?? description,
      );
    }

    if (payload.canonical) {
      const canonical = this.toAbsoluteUrl(payload.canonical);
      this.setCanonical(canonical);
      this.setMetaProperty('og:url', canonical);
    }

    if (payload.robots) {
      this.setMetaName('robots', payload.robots);
    }

    this.setMetaProperty('og:type', payload.ogType ?? 'website');
    this.setMetaName(
      'twitter:card',
      payload.twitterCard ?? 'summary_large_image',
    );

    if (payload.ogImage) {
      const image = this.toAbsoluteUrl(payload.ogImage);
      this.setMetaProperty('og:image', image);
      this.setMetaName('twitter:image', payload.twitterImage ?? image);
    } else {
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("name='twitter:image'");
    }
  }

  setJsonLd(id: string, data: Record<string, unknown> | null) {
    this.clearJsonLd(id);
    if (!data) return;

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', id);
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  clearJsonLd(id: string) {
    this.document.querySelector(`script[data-seo-jsonld="${id}"]`)?.remove();
  }

  private setCanonical(href: string) {
    let link = this.document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  }

  private setMetaName(name: string, content: string) {
    this.meta.updateTag({ name, content }, `name='${name}'`);
  }

  private setMetaProperty(property: string, content: string) {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  /**
   * Público de propósito: os JSON-LD das páginas precisam de URL absoluta e
   * não podem depender de `window.location.origin`, que não existe no SSR.
   */
  toAbsoluteUrl(url: string) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return new URL(normalizedPath, this.appUrl).toString();
  }
}
