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

/**
 * 使用类的方式，通过继承实现
 * 这是一种失败的方式，@Component 之后的组件中，不存在instanceRender方法
 * 因为 vue-property-decorator 中的 @Component 默认了直接父类就是Vue，
 * 因此他认为所有的属性都在当前的class中，实例化时就不会获取原型链上的静态属性。参考源代码
 * class deme extends InstanceRenderClass {  }
 */
// export class InstanceRenderClass extends Vue {
//     static instanceRender(options: ComponentOptions<Vue>) {
//     }
//     instanceClose() {
//     }
// }

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