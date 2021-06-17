class MVVM {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data

        if (this.$el) {
            // 数据劫持 就是把对象的所有属性 改成get和set方法
            new Observer(this.$data)
            // 将 $data 上的属性挂载到 this 上
            this.proxyData(this.$data)
            // 模版编译
            new Compile(this.$el, this)
        }
    }
    proxyData(data) {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key]
                },
                set(newValue) {
                    data[key] = newValue
                }
            })
        })
    }
}