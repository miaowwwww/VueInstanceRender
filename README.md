## 写在前面 
一般情况下我们在使用框架时（react、vue、angular）都是创建一个实例，然后所有的页面都写在#app一个容器内。这样可能会导致一些本高复用，高解耦的弹窗类组件，在使用上变得麻烦/复杂。  

## 现状 
现有的弹窗组件，在组件复用、与父组件的控制耦合、父组件和弹窗组件的通信，都没有让人满意，存在更优解。

一般情况下我们实现一个弹窗组件
```js 
// 伪代码
const template = `<div>
    <Modal 
        :visible="visible" 
        :params1="params1" 
        :params2="params2" 
        @success="onSuccess" 
        @close="onCloase" 
    />
</div>`;

import Modal from './Modal.vue';
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class App extends Vue {
    visible = false;
    modalParams = {};
    onOpen() {
        this.modalParams = {};
        this.visible = true;
    }
    onSuccess() {
        // ...
        this.onClose();
    },
    onClose() {
        this.visible = false;
        this.modalParams = null;
    }
}
```
缺点： 
* 耦合度增加：父组件需要存储对应的变量，注册相应的回调函数
* 复用代码量增加：Modal想要使用的时候，需要重新存贮变量，注册回调
* 嵌套调用增加复杂度：当多个地方使用同一个Modal组件时，把Modal放到最外层可以减少重复代码，但是在传参时却又得一层一层往上传（不使用使用状态机情况下）
* ~~无法同时render多个modal实例~~

## 优化 
参考antd的Modal.info组件，其实我们完全可以在需要的使用的时候，直接创建dom元素，并实例化一个新的Vue实例

改造后使用弹窗类组件的方式
```js
import Modal from './modal';
showModal() {
    const vm = Modal.instanceRender({
        modalParams1,
        modalParams2
        onCallback() {
            
        }
    });
}

```

优点： 
* 解耦：通过显性的prop，大幅度的降低消费者和生产者之间的耦合
* 弹窗组件的状态自治：例如visible、handleClose
* 减少父组件的代码量，随处引入随处使用
* 可多次实例化，实例间可互不干涉
* 返回VM实例对象，依然在父组件的管控之中（使用入参，基本就不需要VM了）
* 可阅读：Modal的所有入参都只能通过prop一次传入，避免了变异,降低复杂度
* 降低学习成本：当你做出一个组件，想要给别人使用的时候。只要写好options入参就可以了。没有套路、没有黑幕。其他部分都可以当成黑盒子。

缺点： 
* 因为是新的Vue实例，主Vue实例原有的基础数据无法继承（例如：i18n，store，，实例属性，实例方法），都需要重新赋值。
* 如果与调用方需要强耦合，会增加沟通成本（这种建议就不要用instanceRender了）
* ts兼容问题。使用@装饰器方式，无法增加新字段，还不如函数式调用
    > `declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;`

## 实现 
如何实现这样一个状态自治、方便使用的Modal组件 
* 给组件创建一个静态方法InstanceRender，用于创建实例
```js
class InstanceRenderClass extends Vue {
     static instanceRender(options: ComponentOptions<Vue>) {
        // 创建vue实例，可组件内固定部分的参数
        const instance = new this({
            el: document.createElement('div'),
            ...options,
            // data: {visible: true, params1: '' },
            // i18n: i18n,
            // store: store,
        });
        // 把实例添加到dom
        document.body.appendChild(instance.$el);
    
        // *如果全局唯一，可存贮实例，通过状态控制显示隐藏,减少创建实例成本*
    }
}
```
* 给组件创建一个关闭的实例方法，用于内部关闭
```js
export class InstanceRenderClass extends Vue {
  // 根据需要隐藏元素、销毁组件、移除dom元素、调用回调
  instanceClose() {
    this.visible = false;
    this.$destroy();
    this.$el.remove();
  }
}
```
* 组件之间的通信。包含两部分：业务状态、vue基础数据（如：i18n等实例属性&方法）
    * 通过options.data传参。建议！单向传参可降低耦合  
    * 通过桥梁。项目使用vuex后，状态都在store中。把store传给新的vue实例。

## 抽象封装  
基于DRY原则，对于下面两点进行抽象封装还是相当有必要的。
> 1. 每一个函数式调用的组件都仅是增加了两个方法：`InstanceRender & instanceClose`  
> 2. 业务参数的输入、固定参数的输入

### 抽象的方法 
```js
import Vue, { VueConstructor } from 'vue';
import { VueClass } from 'vue-class-component/lib/declarations';
import { ComponentOptions } from 'vue/types/options';

interface IInstanceRender {
    instanceRender: (options: ComponentOptions<Vue>) => InstanceType<VueConstructor>
}

/**
 * 基础实现
 * @param Component 想要渲染的目标组件
 * @returns VueClass
 */
export function InstanceRender<VC extends VueClass<Vue>, NVC extends VC & IInstanceRender>(
    Component: NVC
): NVC {
    Component.instanceRender = function (
        options: ComponentOptions<Vue>
    ) {
        const instance = new Component({
            el: document.createElement('div'),
            ...options,
            // i18n: options.i18n,
            // store: options.store,
            // route: options.route,
            // data: options.data,
        });
        document.body.appendChild(instance.$el);
        return instance;
    };

    // 若需要特殊逻辑，可以在Component组件中重写实现
    Component.prototype.instanceClose = function () {
        this.$destroy();
        this.$el.remove();
    };

    return Component as NVC;
}
```

* 通过装饰器的使用方式
```js
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
```

* 基于方法的使用方式 
```js
/* 使用函数的方式调用 */
@Component({ data: () => ({ ctitle: "ctitle" }) })
class HelloWorld extends Vue {
  // declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
  instanceClose: any;
  private handleClose() {
    this.instanceClose();
  }

  created() {
    console.log('create in hellow');
  }
}
export default InstanceRender(HelloWorld);

```

### 问题整理 
**1. 在使用Decorator @的方式调用`HelloWorld.instanceRender`会触发TS的报错** 
> 原因是装饰器的实现就是原封不动的返回入参。 

```js
declare type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
```

解决方法：
* 使用@，并在HellowWorld组件中声明 instanceRender，  
* 通过函数的方式调用。函数调用的方式会正确给Component增加静态属性

**2. 关闭弹窗的实例方法```instanceClose```, 会触发TS报错**  
解决方法：在HelloWorld中给```instanceClose```声明。

**3. 为什么不使用继承的方式给子类增加方法**  

```js
export class InstanceRenderClass extends Vue {
    static instanceRender(options: ComponentOptions<Vue>) {
    }
    instanceClose() {
    }
}

@Component
class HelloWorld extends InstanceRenderClass {
    // --
}
```
原因：
这是一种失败的方式，`@Component` 之后的组件中，不存在`instanceRender`方法.因为 `vue-property-decorator` 中的 `@Component`默认了直接父类就是Vue，因此他认为所有的属性都在当前的class中，实例化时就不会获取原型链上的静态属性。参考源代码可见。 **如有兴趣可以尝试一下`vue-class`**
```js
import { Component, Vue } from "vue-property-decorator";
@Compnoent
class HelloWorld extends Vue {
    // -
}
```

## 其他 
1. 使用InstanceRender的场景，一般是弹窗（规则，创建，详情，confirm）。都是一些fixed的位置，因此你可能会需要禁止body滚动。
```js
/**
 * 对于用的上InstanceRender的组件，一般是fixed的全屏弹窗之类的，因此一般还需要展示之后禁止页面的滚动
 * 希望InstanceRender纯粹一点就不给它增加参数加入其中了
 */
export const lockBodyScrollMixin = {
    created() {
        document.body.style.overflow = "hidden";
    },
    beforeDestroy() {
        document.body.style.overflow = "initial";
    },
}
```
2. 通过修改```instanceRender```静态方法，缓存实例等操作，可以有效提高重复渲染的效率。
3. 组件中可能会出现数据字典等基础请求，设置缓存是很有必要的（或者直接传参）

## 最后 
文中出现都是代码块。重在传递思路。 

```InstanceRender```不仅仅适用于弹窗。而是任何想要高内聚，低耦合，又脱离主视觉的业务，都可以考虑使用。

