const localStrategy = require('passport-local').Strategy;
const db = require('../models/db');
const bcrypt = require('bcryptjs');
const CadastroUser = require('../models/cadastroUser');
const passport = require('passport');

module.exports = function (passport) {
    passport.use(new localStrategy({ usernameField: "email", passwordField: "senha" }, function(email, senha, done) {
        CadastroUser.findOne({where:{email: email}}, function(erro, User) {
            if(erro) {
                return done(erro, false);
            }
            if (!User) {
                return done(null, false, { message: 'Esta conta não Existe' });
            }
            bcrypt.compare(senha, User.senha, function(erro, certa) {
                if (certa) {
                    return done(null, User);
                } else {
                    return done(null, false, {message: 'Senha Incorreta'});
                }
            });
        });
    }));

    passport.serializeUser((User, done) => {
        return done(null, User.id);
    });

    passport.deserializeUser((id, done) => {
        CadastroUser.findOne({ where: { 'id': id } }, (id, erro, User) => {
            return done(erro, User);
        });
    });
}