/**
 * @param {import('@nuxt/http').NuxtHTTPInstance} $http
 * @param {string} baseUrl
 */
export default $http => {
  $http.setHeader("x-requested-with", "XMLHttpRequest");

  return {
    getStats: async () => $http.$get(`/api/stats`),
    getPlayerInfo: async () => $http.$get(`/api/player`),
    getPlayerSessions: async () => $http.$get(`/api/player/sessions`),
    /** @returns {Promise<osuReports.Play[]>} */
    getSessionPlays: async sessionId =>
      $http.$get(`/api/player/sessions/${sessionId}/plays`),
    logout: async () => $http.post(`/logout`)
  };
};
