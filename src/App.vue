<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <div class="test" @click="handleRender">click me</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "./components/HelloWorld.vue";

@Component({
  components: {},
})
export default class App extends Vue {
  handleRender() {
    HelloWorld.instanceRender({ data: { title: "it a titlte" } });
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
