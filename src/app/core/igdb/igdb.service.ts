import { Injectable } from '@angular/core';
import { ExecutionMethod } from 'appwrite';
import { appwrite } from '../appwrite/appwrite.client';

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
export class IgdbService {
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
    return execution
  }

  async syncGames(ids: number[]) {
    const execution = await this.#executeFn({ endpoint: '/sync', payload: { ids } })
    return execution
  }
}
