import { inject, PendingTasks } from '@angular/core';

/**
 * Mantém a aplicação "instável" até a promise resolver.
 *
 * O Angular SSR serializa o HTML assim que a aplicação fica estável. Os
 * serviços do Zetho buscam dados com `fetch()` cru e com o SDK do Appwrite, e
 * nenhum dos dois é rastreado pela zone neste build — o servidor serializava a
 * página no estado de carregamento, entregando ao Google um shell vazio.
 *
 * `PendingTasks` é o mecanismo suportado para registrar trabalho assíncrono
 * que o SSR precisa aguardar. Envolver o carregamento de dados das rotas
 * renderizadas no servidor resolve o problema sem migrar 34 chamadas para
 * `HttpClient`.
 *
 * Precisa ser chamado dentro de um contexto de injeção (construtor de
 * componente ou serviço).
 */
export function createSsrTaskRunner() {
  const pendingTasks = inject(PendingTasks);

  // `PendingTasks.run()` retorna `void` e engole o resultado; `add()` devolve
  // a função de limpeza, o que permite preservar o valor e a tipagem.
  return async <T>(work: () => Promise<T>): Promise<T> => {
    const taskDone = pendingTasks.add();
    try {
      return await work();
    } finally {
      taskDone();
    }
  };
}
