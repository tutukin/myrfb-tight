module.exports = {
    unit:   {
        options:    {
            spawn:  'false'
        },
        files:      ['test/**/*.js', 'src/**/*.js'],
        tasks:      ['mochaTest:unit']
    }
};