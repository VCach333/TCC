const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const passport = require('passport');
require('./config/auth')(passport);

const PostCategoria = require('./models/PostCategoria');
const CadastroUser = require('./models/cadastroUser');
const CadastroProd = require('./models/CadastroProd');
const Carrinho = require('./models/Carrinho');

const admin = require('./routers/admin');  
const { isNullOrUndefined } = require('util');
// const { isNumber } = require('util');
// const { exists } = require('fs');

/* Configurações da Applicação */
const app = express();

/* Configurações da Sessão e do Flash */
app.use(session({
    secret: 'algo',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

/* Configurações do Middleware */
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

/* Configurando o BodyParser */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* Configurando Path, tratamento do Arquivos Estáticos */
app.use(express.static(path.join(__dirname, 'public')));

/* Configurando o Handlebars */
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

/* Rotas */

// app.use('/admin', admin);

app.get('/', function (req, res) {
    res.render('home');
});

/* ROTAS DE USUÁRIOS */
app.get('/perfil', function (req, res) {
    // Carrinho.findAll().then(function (encomendas) {
    //     res.render('perfil', { encomendas: encomendas.map(encomendas => encomendas.toJSON()) });
    // });
    res.render('perfil');
});

app.get('/cadastroUser', function (req, res) {
    res.render('formUser');
});

app.post('/addUser', function (req, res) {
    if (req.body.senha != req.body.confirmaSenha) {
        req.flash('error_msg', 'Sua Senha é diferente da Conirmação da Senha');
        res.redirect('/cadastroUser');
    } else if (typeof req.body.senha == undefined || typeof req.body.confirmaSenha == undefined || req.body.senha == '' || req.body.confirmaSenha == '') {
        req.flash('error_msg', 'Insira uma Senha Válida!');
        res.redirect('/cadastroUser');
    } else if (req.body.nome == '' || typeof req.body.nome == undefined) {
        req.flash('error_msg', 'Insira um Nome para si!');
        res.redirect('/cadastroUser');
    } else if (req.body.email == '' || typeof req.body.email == undefined) {
        req.flash('error_msg', 'Insira um Email para si!');
        res.redirect('/cadastroUser');
    } else {
        CadastroUser.findOne({ where: { 'email': req.body.email } }).then(function (usuario) {
            // {usuario: usuario.map(usuario => usuario.toJSON())}
            console.log(usuario);
            if (usuario) {
                req.flash('error_msg', 'Já existe um Usuário com este email. Tente outro!');
                res.redirect('/cadastroUser');
            } else {
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(req.body.senha, salt, (erro, hash) => {
                        if (erro) {
                            req.flash('error_msg', 'Algo ocorreu mal, tente novamente!');
                            res.redirect('/cadastroUser');
                        } else {
                            CadastroUser.create({
                                nome: req.body.nome,
                                admin: 0,
                                senha: hash,
                                email: req.body.email,
                                telefone: req.body.telefone,
                                endereco: req.body.endereco,
                            }).then(function () {
                                req.flash('success_msg', 'Cadastrado Com Sucesso!')
                                res.redirect('/perfil');
                            }).catch(function (erro) {
                                req.flash('error_msg', 'Algo ocorreu mal, tente novamente!');
                                res.redirect('/cadastroUser');
                            });
                        }
                    });
                });
            }
        }).catch(function (erro) {
            req.flash('error_msg', 'Algo ocorreu mal, tente novamente ..!');
            res.redirect('/cadastroUser');
        });
    }
});

app.get('/login', function (req, res) {
    res.render('formLogin');
});

app.post('/logando', 
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }), function (req, res) {
        res.redirect('/perfil');
    }
);

/* ROTAS DE PRODUTOS */
app.get('/destaque', function (req, res) {
    CadastroProd.findAll({ order: [['id', 'DESC']] }).then(function (produtos) {
        res.render('destaque', { produtos: produtos.map(produtos => produtos.toJSON()) });
    });
});

app.get('/addProdCarrinho/:id', function (req, res) {
    Carrinho.create({
        idProd: req.params.id,
        idUser: 1
    }).then(function () {
        req.flash('success_msg', 'Produto Adicionado ao Carrinho');
        res.redirect('/destaque');
    }).catch(function (erro) {
        req.flash('error_msg', 'Houve um erro ao Adicionar o Produto ao Carrinho');
        res.redirect('/destaque');
    });
});

/* ROTAS CATEGORIAS */
app.get('/categorias', function (req, res) {
    PostCategoria.findAll({ order: [['id', 'DESC']] }).then(function (categorias) {
        res.render('categorias', {categorias: categorias.map(categorias => categorias.toJSON())});
    });
});

app.get('/showCategoria/:titulo', function (req, res) {
    CadastroProd.findAll({ where: { 'categoria': req.params.titulo } }).then(function (produtos) {
        res.render('showCategoriaProd', { produtos: produtos.map(produtos => produtos.toJSON()) });
    });
});

/* OUTRAS ROTAS */
// app.get('/search', function (req, res) {
//     CadastroProd.findAll({where: {'nome': req.body.inSearch}}).then(function(produtos) {
//         res.render('destaque', {produtos: produtos.map(produtos => produtos.toJSON())});
//     });
// });

app.get('/sobre', function (req, res) {
    res.render('sobre');
});




app.use('/admin', admin); // Uso para Grupos de Rotas

/* Definindo a Porta do nosso Servidor */
app.listen('3000');
console.log('Servidor Rodando -- localhost:3000');