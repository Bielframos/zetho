import { Injectable, ɵɵsetComponentScope } from '@angular/core';
import { appwrite } from '../appwrite/appwrite.client';
import { ExecutionMethod } from 'appwrite';
import { Game } from '../types';

type SearchProps = {
  endpoint: '/search',
  payload: { query: string }
}

type SyncProps = {
  endpoint: '/sync',
  payload: { ids: number[] }
}

type EndpointProps = SearchProps | SyncProps

@Injectable({
  providedIn: 'root',
})
export class Igdb {
  functions = appwrite.functions

  async #executeFn(params: EndpointProps) {
    return await this.functions.createExecution({
      functionId: 'igdb-core',
      body: JSON.stringify(params.payload),
      xpath: params.endpoint,
      method: ExecutionMethod.POST
    })
  }

  async searchGames(query: string) {
    const execution = await this.#executeFn({ endpoint: '/search', payload: { query } })
    return JSON.parse(execution.responseBody) as { games: Game[] }
  }

  async syncGames(ids: number[]) {
    const execution = await this.#executeFn({ endpoint: '/sync', payload: { ids } })
    return execution.responseBody
  }
}
