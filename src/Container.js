// class Container
function Container() {
    this._new();
}

// Util
Container.extend = function (dest, src) {
    for (i in src) dest[i] = src[i];
}

// class Container
Container.extend(Container.prototype, {

    _new: function () {
        this._resolved = new Container.Hash();
        this._register = new Container.Hash();
        this._dependencies = new Container.Hash();
    },
    register: function (name, definition, dependencies) {

        // clean up
        this.remove(name);

        if (Container.isFunction(definition)) {
            this._register.set(name, definition);
            this._dependencies.set(name, dependencies || definition.$inject);
        }
        else {
            this.set(name, definition);
        }

        // to chain
        return this;
    },
    get: function (name) {

        // return self
        if(name == 'container') return this;

        // if resolved return
        if (this._resolved.has(name)) return this._resolved.get(name);

        // if not registered return null
        if (!this._register.has(name)) return null;

        // resolve
        this.set(name, this.create(name));

        return this.get(name);
    },
    set: function (name, definition) {
        this._resolved.set(name, definition);
    },
    create: function (name) {

        if (!this._register.has(name)) return null;

        // get _class
        var _class = this._register.get(name);

        // null if not a function
        if (!Container.isFunction(_class)) return null;

        // get names
        var $inject = this._dependencies.has(name) ? this._dependencies.get(name) : [];

        // args collection
        var args = [];

        // collect args
        for (var i = 0; i < $inject.length; i++)
            args.push(this.get($inject[i]));

        // make creator with args
        var creator = Container.bind(_class, args);

        // create
        return new creator();
    },
    remove: function (name) {
        this._register.remove(name);
        this._resolved.remove(name);
        this._dependencies.remove(name);
    }
});

// class Hash
Container.Hash = function (hash) {
    this._new(hash);
}

Container.extend(Container.Hash.prototype, {

    _new: function (hash) {
        this.hash = hash || {};
    },
    get: function (name) {
        return this.has(name) ? this.hash[name] : null;
    },
    set: function (name, value) {
        this.hash[name] = value;
    },
    has: function (name) {
        return this.hash[name] != undefined;
    },
    remove: function (name) {
        return this.has(name) && delete this.hash[name];
    }
});


// Tools

Container.extend(Container, {
    isFunction: function (value) {
        return value instanceof Function;
    },
    bind: function (_class, args) {

        function bind() {
            return _class.apply(this, args);
        }

        bind.prototype = _class.prototype;

        return bind;
    }
});


module.exports = Container;
