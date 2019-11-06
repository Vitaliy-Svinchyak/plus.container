const Container = require('./modules/Container')
const Loader = require('./modules/Loader')

Container.extend(Container, {
    load: function (options) {
        return new Loader(options).load()
    },
})

module.exports = Container
