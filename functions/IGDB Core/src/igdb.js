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

  async searchGames(token, query) {}

  async getGameTypes(limit, offset) {
    const response = await fetch('https://api.igdb.com/v4/game_types', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'text/plain',
      },
      body: `fields *; limit ${limit}; offset ${offset};`,
    });
    const data = await response.json();
    return data;
  }

  // Define o token de acesso
  setToken(token) {
    this.token = token;
  }
}

export default IGDBService;
