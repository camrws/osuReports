<template>
  <section class="container">
    <div class="row justify-content-center">
      <play v-for="play in plays" :key="play.date" v-bind="play" class="col-xl-6 col-12" />
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      plays: []
    };
  },
  async asyncData({ params, app: { $api } }) {
    return {
      plays: await $api.getSessionPlays(params.sessionId)
    };
  },
  validate(ctx) {
    const reportId = ctx.params.sessionId;
    return !!reportId && !/\D/.test(reportId);
  }
};
</script>

<style lang="scss" scoped>
div.row {
  max-width: 1440px;
  margin: 0 auto;
}
</style>