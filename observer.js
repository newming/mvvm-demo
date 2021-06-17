class Observer {
    constructor(data) {
        this.observer(data)
    }

    observer(data) {
        // 对 data 数据原有的属性改成 set 和 get 的形式
        if (!data || typeof data !== 'object') {
            return
        }
        // 将数据 一一劫持
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key])
            // 深度递归劫持（如果是对象）
            this.observer(data[key])
        })
    }
    // 定义响应式
    defineReactive(obj, key, value) {
        let that = this;
        let dep = new Dep() // 每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                // Dep.target = null
                return value
            },
            set(newValue) {
                if (newValue != value) {
                    that.observer(newValue) // 如果是对象继续劫持
                    value = newValue
                    dep.notify() // 通知所有人 数据更新了
                }
            }
        })
    }
}

class Dep {
    constructor() {
        // 订阅的数组
        this.subs = []
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        this.subs.forEach(watcher => {
            watcher.update() // 调用的是 watcher.js 中的 update 方法
        })
    }
}