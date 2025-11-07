class IGDBService {
  token = '';

  constructor(token) {
    this.token = token;
  }

  /**
   * Método para autenticar e obter um token de acesso da IGDB
   * @param {*} clientId
   * @param {*} clientSecret
   */
  async authenticate(clientId, clientSecret) {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  // Método privado para fazer requisições à API da IGDB
  async #fetch(method = 'POST', endpoint, body = '') {
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method,
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    const data = await response.json();
    return data;
  }

  async searchGames(query, limit, offset) {
    const body = `search "${query}"; fields name,slug,game_status,game_type,summary,cover.image_id,first_release_date; where game_type != (2,3,5,7,12,13,14); limit ${limit}; offset ${offset};`;
    const data = await this.#fetch('POST', 'games', body);
    return data;
  }

  async getGamesByIds(ids) {
    const idsString = ids.join(',');
    const body = `fields name,slug,game_status,game_type,summary,cover.image_id,first_release_date; where id = (${idsString});`;
    const data = await this.#fetch('POST', 'games', body);
    return data;
  }

  async getGameTypes(limit, offset) {
    const body = `fields id,type,checksum; limit ${limit}; offset ${offset};`;
    const data = await this.#fetch('POST', 'game_types', body);
    return data;
  }

  // Define o token de acesso
  setToken(token) {
    this.token = token;
  }
}

export default IGDBService;
