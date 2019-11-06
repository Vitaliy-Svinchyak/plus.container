// class Container
function Container () {
    this._new()
}

// Util
Container.extend = function (dest, src) {
    for (let i in src) {
        dest[i] = src[i]
    }
}

Container.create = function () {
    return new Container()
}

// class Container
Container.extend(Container.prototype, {

    _new: function () {
        this._resolved = new Map()
        this._register = new Map()
        this._factories = new Map()
        this._dependencies = new Map()
        this._tags = new Map()
    },
    add: function (name, definition, dependencies) {
        return this.register(name, definition, dependencies)
    },
    register: function (name, definition) {
        if (Container.isFunction(definition)) {
            this._register.set(name, definition)
            this._dependencies.set(name, definition.$inject || [])
            this._tags.set(name, definition.$tags || [])
        } else {
            this.set(name, definition)
        }

        // to chain
        return this
    },
    registerLazy: function (name, path, tags) {
        this._tags.set(name, tags || [])
        this.set(name, path)

        // to chain
        return this
    },
    registerLazyFactory: function (name, path, tags) {
        this._tags.set(name, tags || [])
        this._factories.set(name, path)

        // to chain
        return this
    },
    get: function (name) {
        let object = this._resolved.get(name)
        if (object && typeof object !== 'string') {
            return object
        }
        // return self
        if (name === 'container') {
            return this
        }

        // lazy registering
        if ((object && typeof object === 'string') || this._factories.has(name)) {
            if (!object) {
                object = this._factories.get(name)
            }

            object = require(object)
            this.delete(name)
            this.register(name, object)
        }

        // if not registered return null
        if (!this._register.has(name)) {
            return null
        }

        // resolve
        this.set(name, this.create(name))

        return this.get(name)
    },
    set: function (name, definition) {
        this._resolved.set(name, definition)
    },
    create: function (name) {
        if (this._factories.has(name)) {
            return this._createFromFactory(name)
        }

        if (!this._register.has(name)) {
            return null
        }

        // get _class
        let _class = this._register.get(name)

        // null if not a function
        if (!Container.isFunction(_class)) {
            return null
        }

        return this._createArrayInjected(name)
    },
    delete: function (name) {
        this._register.delete(name)
        this._resolved.delete(name)
        this._dependencies.delete(name)
        this._factories.delete(name)
        this._tags.delete(name)
    },
    find: function (include = [], exclude = []) {
        let result = []

        for (let [name, tags] of this._tags) {
            for (let tag of include) {
                if (tags.indexOf(tag) === -1) {
                    break
                }
            }

            for (let tag of exclude) {
                if (tags.indexOf(tag) !== -1) {
                    break
                }
            }

            result.push(this.get(name))
        }

        return result
    },
    _createArrayInjected: function (name) {
        // get class
        let _class = this._register.get(name)

        // get names
        let $inject = this._dependencies.get(name) || []

        // args collection
        let args = []

        // collect args
        for (let injection of $inject) {
            args.push(this.get(injection))
        }

        // create
        return new _class(...args)
    },
    _createFromFactory: function (name) {
        // get class
        let _class = this._register.get(name)

        // get names
        let $inject = this._dependencies.get(name) || []

        // args collection
        let args = []

        // collect args
        for (let injection of $inject) {
            args.push(this.get(injection))
        }

        // create

        return _class(...args)
    },
})

// Tools
Container.extend(Container, {
    isFunction: function (value) {
        return value instanceof Function
    },
    isArray: function (value) {
        return Object.prototype.toString.call(value) === '[object Array]'
    },
    each: function (hash, fn) {
        for (let i = 0; i < hash.length; i++) {
            fn(hash[i], i)
        }
    },
})

module.exports = Container
