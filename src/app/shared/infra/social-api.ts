import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { appwrite } from './appwrite/appwrite.client';

@Injectable({ providedIn: 'root' })
export class SocialApi {
  async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const jwt = (await appwrite.account.createJWT()).jwt;
    const response = await fetch(new URL(path, environment.zethoApiEndpoint), {
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `API request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    const content = await response.text();
    return content ? JSON.parse(content) as T : undefined as T;
  }
}
