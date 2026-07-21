import { Injectable } from '@angular/core';
import { toBlob } from 'html-to-image';
import { appwrite } from '../appwrite/appwrite.client';

/**
 * Gera imagens instagramáveis (cards de compartilhamento) renderizando um nó
 * DOM estilizado no cliente com `html-to-image`. Imagens externas (capas do
 * IGDB, avatares) são proxiadas via Appwrite Avatars para evitar
 * contaminação de canvas (CORS).
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Proxia uma imagem externa pelo endpoint do Appwrite (CORS-limpo). */
  proxyImage(url: string | null | undefined, width = 600, height = 800) {
    if (!url) return null;
    try {
      return String(appwrite.avatars.getImage({ url, width, height }));
    } catch {
      return url;
    }
  }

  /** Avatar de fallback com as iniciais do usuário. */
  initialsAvatar(name: string, size = 96) {
    return String(
      appwrite.avatars.getInitials({
        name,
        width: size,
        height: size,
        background: '3e63dd',
      }),
    );
  }

  /** Renderiza o nó em um PNG de alta resolução (pixelRatio 2). */
  async exportNode(node: HTMLElement, width: number, height: number) {
    const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } })
      .fonts;
    if (fonts?.ready) {
      await fonts.ready;
    }

    const blob = await toBlob(node, {
      pixelRatio: 2,
      width,
      height,
      cacheBust: true,
      backgroundColor: '#0c111c',
      // Neutraliza o transform de escala usado no preview durante a captura.
      style: { transform: 'none', transformOrigin: 'top left' },
    });

    if (!blob) throw new Error('Não foi possível gerar a imagem.');
    return blob;
  }

  /**
   * Entrega a imagem: tenta o compartilhamento nativo (abre o sheet do SO),
   * com fallback para download.
   */
  async deliver(
    blob: Blob,
    filename: string,
  ): Promise<'shared' | 'downloaded'> {
    const file = new File([blob], filename, { type: 'image/png' });

    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
    };

    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch {
        // usuário cancelou ou o share falhou → cai para download
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }
}
