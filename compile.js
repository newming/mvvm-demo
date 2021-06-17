class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        if (this.el) {
            // 开始编译
            // 1. 先把真实的 dom 移动到内存中 fragment
            let fragment = this.node2fragment(this.el)
            // 2. 编译 => 提取想要的元素节点 v-model 和文本节点 {{}}
            this.compile(fragment)
            // 3. 把编译好的 fragment 在赛回到页面中
            this.el.appendChild(fragment)
        }
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
    isDirective(name) {
        return name.startsWith('v-')
    }
    complieElement(node) {
        // 带 v-model
        let attrs = node.attributes
        Array.from(attrs).forEach(attr => {
            // 判断属性名是否包含 v-
            let attrName = attr.name
            if (this.isDirective(attrName)) {
                let expr = attr.value
                let type = attrName.slice(2)
                // node this.vm.$data expr
                CompileUtil[type](node, this.vm, expr)
            }
        })
    }
    complieText(node) {
        // 带 {{}}
        let text = node.textContent
        let reg = /\{\{([^}]+)\}\}/g
        if (reg.test(text)) {
            // node this.vm.$data text
            CompileUtil['text'](node, this.vm, text)
        }
    }
    compile(fragment) {
        let childNodes = fragment.childNodes
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 是元素节点，还需要继续深入检查
                this.complieElement(node)
                this.compile(node)
            } else {
                // 文本节点
                this.complieText(node)
            }
        })
    }
    node2fragment(el) {
        // 需要将el中的内容全部放到内存中
        let fragment = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment
    }
}

CompileUtil = {
    getVal(vm, expr) {
        expr = expr.split('.') // message.a => [message, a]
        return expr.reduce((prev, next) => {
            return prev[next]
        }, vm.$data)
    },
    setVal (vm, expr, value) {
        expr = expr.split('.') // message.a => [message, a]
        return expr.reduce((prev, next, currentIndex) => {
            // 当最后一项的时候赋值
            if (currentIndex === expr.length -1) {
                return prev[next] = value
            }
            return prev[next]
        }, vm.$data)
    },
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            return this.getVal(vm, arguments[1].trim())
        })
    },
    text(node, vm, expr) {
        // 文本处理
        let updateFn = this.updater['textUpdater']
        let value = this.getTextVal(vm, expr)

        // {{a.b}}
        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            new Watcher(vm, arguments[1].trim(), (newValue) => {
                // 如果数据变化了，文本节点需要重新获取依赖的属性更新文本内容
                updateFn && updateFn(node, this.getTextVal(vm, expr))
            })
        })
        updateFn && updateFn(node, value)
    },
    model(node, vm, expr) {
        // v-model 处理
        let updateFn = this.updater['modelUpdater']
        new Watcher(vm, expr, (newValue) => {
            // 当值变化后会调用 cb
            updateFn && updateFn(node, this.getVal(vm, expr))
        })

        node.addEventListener('input', (e) => {
            let newValue = e.target.value
            this.setVal(vm, expr, newValue)
        })
        updateFn && updateFn(node, this.getVal(vm, expr))
    },
    updater: {
        textUpdater(node, value) {
            // 文本更新
            node.textContent = value
        },
        modelUpdater(node, value) {
            // 输入框更新
            node.value = value
        }
    }
}