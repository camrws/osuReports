export default $http => ({
  getStats: async () => $http.$get("/api/stats"),
  getPlayerInfo: async () => $http.$get("/api/player")
});
