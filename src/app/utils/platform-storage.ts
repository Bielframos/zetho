/**
 * Acesso a Web Storage seguro para SSR.
 *
 * No Node não existe `localStorage` nem `sessionStorage`, e tocar neles
 * durante o render derruba a requisição inteira. Também cobre o browser em
 * modo restrito (Safari privado, cookies bloqueados), onde os objetos existem
 * mas lançam ao serem usados.
 *
 * Falha sempre em silêncio: storage é cache de conveniência, nunca fonte de
 * verdade — nenhuma leitura aqui deve ser capaz de quebrar a aplicação.
 */
function getStore(kind: 'local' | 'session'): Storage | null {
  try {
    if (typeof globalThis === 'undefined') return null;
    const store =
      kind === 'local'
        ? (globalThis as any).localStorage
        : (globalThis as any).sessionStorage;
    return (store as Storage | undefined) ?? null;
  } catch {
    return null;
  }
}

function read(kind: 'local' | 'session', key: string): string | null {
  try {
    return getStore(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(kind: 'local' | 'session', key: string, value: string): void {
  try {
    getStore(kind)?.setItem(key, value);
  } catch {
    // Quota estourada ou storage bloqueado: ignorar.
  }
}

function remove(kind: 'local' | 'session', key: string): void {
  try {
    getStore(kind)?.removeItem(key);
  } catch {
    // Ignorar.
  }
}

export const safeLocalStorage = {
  getItem: (key: string) => read('local', key),
  setItem: (key: string, value: string) => write('local', key, value),
  removeItem: (key: string) => remove('local', key),
  clear: () => {
    try {
      getStore('local')?.clear();
    } catch {
      // Ignorar.
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string) => read('session', key),
  setItem: (key: string, value: string) => write('session', key, value),
  removeItem: (key: string) => remove('session', key),
  clear: () => {
    try {
      getStore('session')?.clear();
    } catch {
      // Ignorar.
    }
  },
};
