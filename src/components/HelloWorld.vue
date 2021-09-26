<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <h1>{{ ctitle }}</h1>
    <br />
    <span @click="handleClose">close</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { InstanceRender, lockBodyScrollMixin } from "@/utils";

/* 使用装饰器的方式调用 */
@InstanceRender
@Component({
  mixins: [lockBodyScrollMixin],
  data: () => ({ ctitle: "ctitle" }),
})
export default class HelloWorldWithDecorator extends Vue {
  // 如果通过装饰器@的方式使用InstanceRender，则对 instanceRender进行声明是必须的。原因如下
  // declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
  static instanceRender: any;
  instanceClose: any;

  private handleClose() {
    this.instanceClose();
  }
}

/* 使用函数的方式调用 */
// @Component({ data: () => ({ ctitle: "ctitle" }) })
// class HelloWorld extends Vue {
//   // declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
//   instanceClose: any;
//   private handleClose() {
//     this.instanceClose();
//   }

//   created() {
//     console.log('create in hellow');
//   }
// }
// export default InstanceRender(HelloWorld);
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
