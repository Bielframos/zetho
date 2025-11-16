class IGDBService {
  token = '';

  constructor(token) {
    this.token = token;
  }

  /**
   * Autentica e obtém um novo token de acesso da IGDB (via Twitch API)
   */
  async authenticate(clientId, clientSecret) {
    const url = new URL('https://id.twitch.tv/oauth2/token');
    url.search = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();

    this.setToken(data.access_token);
    return data;
  }

  /**
   * Define o token de acesso atual
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Executa requisições autenticadas à API da IGDB
   */
  async #fetch(endpoint, body, method = 'POST') {
    if (!this.token) throw new Error('Token de acesso IGDB ausente.');

    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method,
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro IGDB: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Campos padrão usados em quase todas as consultas de jogos
   */
  #gameFields =
    'name,slug,game_status,game_type,summary,cover.image_id,first_release_date,similar_games,checksum,genres.*,involved_companies.*';

  /**
   * Busca jogos com filtros padrão (exclui versões e tipos indesejados)
   */
  async getGames(limit = 50, offset = 0) {
    const query = `
      fields ${this.#gameFields};
      where rating >= 48
        & version_parent = null
        & game_type != (3,5,7,12,13,14);
      limit ${limit};
      offset ${offset};
    `.trim();

    return await this.#fetch('games', query);
  }

  /**
   * Busca jogos por texto (nome, slug, etc.)
   */
  async searchGames(queryText, limit = 20, offset = 0) {
    const query = `
      search "${queryText}";
      fields ${this.#gameFields};
      where version_parent = null
        & game_type != (3,5,7,12,13,14);
      limit ${limit};
      offset ${offset};
    `.trim();

    return await this.#fetch('games', query);
  }

  /**
   * Busca jogos por IDs específicos
   */
  async getGamesByIds(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const idsString = ids.join(',');

    const query = `
      fields ${this.#gameFields};
      where id = (${idsString});
    `.trim();

    return await this.#fetch('games', query);
  }

  /**
   * Busca empresas por IDs específicos
   */
  async getCompaniesByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const idsString = ids.join(',');

    const query = `
      fields name,slug,checksum;
      where id = (${idsString});
    `.trim();

    return await this.#fetch('companies', query);
  }

  /**
   * Lista os tipos de jogos disponíveis
   */
  async getGameTypes(limit = 50, offset = 0) {
    const query = `
      fields id,type,checksum;
      limit ${limit};
      offset ${offset};
    `.trim();

    return await this.#fetch('game_types', query);
  }
}

export default IGDBService;
