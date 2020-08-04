export default {
  server: {
    port: 3000,
    host: "0.0.0.0"
  },
  css: ["~/assets/css/base.css"],
  serverMiddleware: [
    "~/src/server/middleware.js",
    "~/src/server/api/middleware.js",
    "~/src/server/api/twitter.js"
  ],
  buildModules: ["@nuxt/typescript-build", "@nuxtjs/tailwindcss"],
  modules: ["@nuxt/http", "~/modules/extractCSS"],
  plugins: ["~/plugins/api", "~/plugins/polyfills"],
  http: {
    browserBaseURL: "/"
  },
  components: true,
  watch: ["~/types/*"],
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        "postcss-focus-visible": {},
        autoprefixer: {}
      }
    }
  }
};
